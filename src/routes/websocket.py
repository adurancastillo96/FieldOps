import os
import json
import base64
import logging
import asyncio
from contextlib import aclosing
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.genai import types

from src.agents.orchestrator import root_agent, log_ai_interaction

logger = logging.getLogger("fieldops-websocket")
router = APIRouter(tags=["WebSocket"])

session_service = InMemorySessionService()

runner = Runner(
    app_name="fieldops",
    agent=root_agent,
    session_service=session_service,
)

APP_NAME = "fieldops"
DEMO_AGENT_MODEL = os.environ.get("DEMO_AGENT_MODEL", "gemini-live-2.5-flash-native-audio")

@router.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, session_id: str):
    await websocket.accept()
    logger.info("WebSocket connected: user=%s session=%s", user_id, session_id)

    # Detect native audio vs text configurations
    is_native_audio = "native-audio" in DEMO_AGENT_MODEL or "native" in DEMO_AGENT_MODEL

    if is_native_audio:
        run_config = RunConfig(
            streaming_mode=StreamingMode.BIDI,
            response_modalities=["AUDIO"],
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Sadaltager",
                    )
                )
            ),
        )
    else:
        run_config = RunConfig(
            streaming_mode=StreamingMode.BIDI,
            response_modalities=["TEXT"],
        )

    # Retrieve or initialize session state
    session = await session_service.get_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id,
    )
    if session is None:
        session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
        )
        logger.info("Created new session: %s", session_id)
    else:
        logger.info("Resumed existing session: %s", session_id)

    live_request_queue = LiveRequestQueue()

    async def upstream_task():
        # Buffer incoming raw PCM audio bytes (16kHz s16le mono) to ~100ms
        _AUDIO_CHUNK_BYTES = 3200
        _audio_buf = bytearray()

        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                _audio_buf.extend(message["bytes"])
                while len(_audio_buf) >= _AUDIO_CHUNK_BYTES:
                    chunk = bytes(_audio_buf[:_AUDIO_CHUNK_BYTES])
                    del _audio_buf[:_AUDIO_CHUNK_BYTES]
                    live_request_queue.send_realtime(
                        types.Blob(data=chunk, mime_type="audio/pcm")
                    )

            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                except json.JSONDecodeError:
                    continue

                msg_type = payload.get("type", "")

                if msg_type == "text":
                    text_content = payload.get("content", "")
                    if text_content:
                        live_request_queue.send_content(
                            types.Content(
                                role="user",
                                parts=[types.Part(text=text_content)],
                            )
                        )

                elif msg_type == "image_frame":
                    b64_data = payload.get("data", "")
                    if b64_data:
                        if "," in b64_data:
                            b64_data = b64_data.split(",", 1)[1]
                        jpeg_bytes = base64.b64decode(b64_data)
                        live_request_queue.send_realtime(
                            types.Blob(data=jpeg_bytes, mime_type="image/jpeg")
                        )

    async def downstream_task():
        _user_said = ""
        _agent_said = ""

        async with aclosing(runner.run_live(
            session=session,
            live_request_queue=live_request_queue,
            run_config=run_config,
        )) as live_events:
            try:
                async for event in live_events:
                    event_json = event.model_dump_json(exclude_none=True, by_alias=True)
                    await websocket.send_text(event_json)

                    event_dict = json.loads(event_json)

                    # Accumulate input speech transcriptions
                    input_text = (
                        event_dict.get("inputTranscription", {}).get("text")
                        or event_dict.get("input_transcription", {}).get("text")
                    )
                    if input_text:
                        _user_said = input_text

                    # Accumulate output speech response transcriptions
                    output_text = (
                        event_dict.get("outputTranscription", {}).get("text")
                        or event_dict.get("output_transcription", {}).get("text")
                    )
                    if output_text:
                        _agent_said = output_text

                    # Log interaction and notify client on turn completion
                    if event_dict.get("turnComplete") or event_dict.get("turn_complete"):
                        entry = log_ai_interaction(_user_said, _agent_said)
                        if entry:
                            await websocket.send_text(json.dumps({
                                "type": "ai_log",
                                "entry": entry,
                            }))
                        _user_said = ""
                        _agent_said = ""
            except (ValueError, KeyError, TypeError) as exc:
                logger.warning("Recoverable live error: %s", exc)
                try:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Session error: {exc}",
                    }))
                except Exception:
                    pass
                raise

    up = asyncio.create_task(upstream_task())
    down = asyncio.create_task(downstream_task())
    done, pending = await asyncio.wait([up, down], return_when=asyncio.FIRST_EXCEPTION)

    try:
        for task in done:
            task.result()
    except WebSocketDisconnect:
        logger.info("Client disconnected: session=%s", session_id)
    except Exception as exc:
        logger.error("Live session error: session=%s error=%s", session_id, exc, exc_info=True)
    finally:
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
