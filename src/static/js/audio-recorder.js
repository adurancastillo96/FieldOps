/**
 * Audio Recorder Worklet Client for FieldOps PWA.
 */
const FieldOpsAudioRecorder = (function() {
    let audioContext = null;
    let audioRecorderNode = null;
    let micStream = null;

    async function start(audioRecorderHandler) {
        if (audioContext) return [audioRecorderNode, audioContext, micStream];

        console.log("Initializing AudioRecorder Worklet Node...");
        audioContext = new AudioContext({ sampleRate: 16000 });

        // Load processor modules
        await audioContext.audioWorklet.addModule('/js/pcm-processor.js');

        // Request user microphone permissions
        micStream = await navigator.mediaDevices.getUserMedia({
            audio: { channelCount: 1 }
        });
        
        const source = audioContext.createMediaStreamSource(micStream);
        
        audioRecorderNode = new AudioWorkletNode(
            audioContext,
            'pcm-recorder-processor'
        );

        source.connect(audioRecorderNode);
        
        audioRecorderNode.port.onmessage = (event) => {
            // Convert Float32 samples from browser to 16-bit PCM buffer format
            const pcmData = convertFloat32ToPCM(event.data);
            audioRecorderHandler(pcmData);
        };

        console.log("AudioRecorder Worklet Node initialized");
        return [audioRecorderNode, audioContext, micStream];
    }

    function stop() {
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
            audioRecorderNode = null;
        }
        console.log("Audio recorder stopped");
    }

    function convertFloat32ToPCM(inputData) {
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            // Scale Float32 value into 16-bit signed range
            pcm16[i] = inputData[i] * 32767;
        }
        return pcm16.buffer;
    }

    return {
        start: start,
        stop: stop
    };
})();
