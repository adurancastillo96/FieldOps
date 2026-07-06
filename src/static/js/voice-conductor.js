/**
 * Offline Voice Conductor service for FieldOps (SpeechRecognition + SpeechSynthesis).
 */
const FieldOpsVoiceConductor = (function() {
    let recognition = null;
    let isListening = false;
    
    const btnVoiceAgent = document.getElementById('btn-voice-agent');
    const voicePrompt = document.getElementById('voice-agent-prompt');
    const voiceWaves = document.getElementById('voice-waves');

    function initVoice() {
        console.log("Initializing SpeechRecognition...");
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser");
            voicePrompt.textContent = "Reconocimiento de voz no soportado (Simulación activa)";
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'es-ES'; // Spanish primary
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isListening = true;
            btnVoiceAgent.className = 'btn-voice active';
            voicePrompt.textContent = "Escuchando comandos offline...";
            voiceWaves.classList.add('active');
        };

        recognition.onend = () => {
            isListening = false;
            btnVoiceAgent.className = 'btn-voice inactive';
            voicePrompt.textContent = "Mantenga presionado el micrófono para hablar...";
            voiceWaves.classList.remove('active');
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error: ", event.error);
            isListening = false;
            btnVoiceAgent.className = 'btn-voice inactive';
            voiceWaves.classList.remove('active');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log("Speech recognized: ", transcript);
            processVoiceCommand(transcript);
        };
    }

    // Command Intent Router
    function processVoiceCommand(text) {
        // Append user transcript to UI log if function exists
        if (window.FieldOpsApp && typeof window.FieldOpsApp.appendDialogue === 'function') {
            window.FieldOpsApp.appendDialogue('user', text);
        } else {
            console.log("User Speech bubble: ", text);
        }

        // Trigger haptic feedback vibration
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        // Simple keyword matcher (Conductor Mode)
        if (text.includes('foto') || text.includes('capturar') || text.includes('tomar')) {
            announceTTS("Tomando fotografía");
            triggerCapture();
        } else if (text.includes('siguiente') || text.includes('continuar')) {
            announceTTS("Siguiente paso");
            triggerNextStep();
        } else if (text.includes('anterior') || text.includes('atrás') || text.includes('regresar')) {
            announceTTS("Regresando al paso anterior");
            triggerPrevStep();
        } else if (text.includes('repetir') || text.includes('instrucción')) {
            triggerRepeatInstruction();
        } else if (text.includes('resumen') || text.includes('estado')) {
            triggerShowSummary();
        } else {
            announceTTS("Comando no reconocido. Intente: foto, siguiente, anterior o repetir.");
        }
    }

    // Core TTS announcer
    function announceTTS(message) {
        console.log("Announcing TTS: ", message);
        if ('speechSynthesis' in window) {
            // Cancel current announcements
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechUtterance(message);
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);
        }
    }

    // Toggles speech capturing state
    function startListening() {
        if (recognition && !isListening) {
            try {
                recognition.start();
            } catch (err) {
                console.error("Error starting speech recognition: ", err);
            }
        } else if (!recognition) {
            // Mock simulation for browsers without SpeechRecognition
            simulateVoiceCommand();
        }
    }

    function stopListening() {
        if (recognition && isListening) {
            recognition.stop();
        }
    }

    // Mock command simulation
    function simulateVoiceCommand() {
        const mockCommands = [
            "tomar foto",
            "siguiente paso",
            "repetir instrucción",
            "resumen de instalación"
        ];
        // Select random command
        const randomCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)];
        voicePrompt.textContent = `Escuchando: "${randomCommand}" (Simulado)`;
        btnVoiceAgent.className = 'btn-voice active';
        voiceWaves.classList.add('active');
        
        setTimeout(() => {
            btnVoiceAgent.className = 'btn-voice inactive';
            voiceWaves.classList.remove('active');
            voicePrompt.textContent = "Mantenga presionado el micrófono para hablar...";
            processVoiceCommand(randomCommand);
        }, 1500);
    }

    // Action Trigger Hooks matching app state callbacks
    function triggerCapture() {
        const btn = document.getElementById('btn-capture');
        if (btn && !btn.disabled) {
            btn.click();
        }
    }

    function triggerNextStep() {
        if (typeof FieldOpsVoiceConductor.triggerNextStep === 'function') {
            FieldOpsVoiceConductor.triggerNextStep();
        } else {
            console.log("Trigger next step (not bound)");
        }
    }

    function triggerPrevStep() {
        if (typeof FieldOpsVoiceConductor.triggerPrevStep === 'function') {
            FieldOpsVoiceConductor.triggerPrevStep();
        } else {
            console.log("Trigger previous step (not bound)");
        }
    }

    function triggerRepeatInstruction() {
        const activeTitle = document.getElementById('active-step-title');
        if (activeTitle) {
            announceTTS(activeTitle.textContent);
        }
    }

    function triggerShowSummary() {
        const jsonPre = document.getElementById('json-report');
        if (jsonPre) {
            announceTTS("Mostrando resumen del reporte de auditoría.");
        }
    }

    return {
        init: initVoice,
        start: startListening,
        stop: stopListening,
        announce: announceTTS,
        triggerNextStep: null,
        triggerPrevStep: null
    };
})();

// Bind mic events
window.addEventListener('DOMContentLoaded', () => {
    FieldOpsVoiceConductor.init();
    const btn = document.getElementById('btn-voice-agent');
    if (btn) {
        btn.addEventListener('mousedown', FieldOpsVoiceConductor.start);
        btn.addEventListener('mouseup', FieldOpsVoiceConductor.stop);
        // Mobile touch support
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            FieldOpsVoiceConductor.start();
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            FieldOpsVoiceConductor.stop();
        });
    }
});
