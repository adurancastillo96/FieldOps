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
            voicePrompt.textContent = "Speech recognition not supported (Simulation active)";
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US'; // English primary
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isListening = true;
            btnVoiceAgent.className = 'btn-voice active';
            voicePrompt.textContent = "Listening for offline commands...";
            voiceWaves.classList.add('active');
        };

        recognition.onend = () => {
            isListening = false;
            btnVoiceAgent.className = 'btn-voice inactive';
            voicePrompt.textContent = "Hold mic button to talk...";
            voiceWaves.classList.remove('active');
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error: ", event.error);
            isListening = false;
            btnVoiceAgent.className = 'btn-voice inactive';
            voiceWaves.classList.remove('active');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("Speech recognized: ", transcript);
            
            // Trigger haptic feedback vibration
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
            
            const chatInput = document.getElementById('chat-text-input');
            if (chatInput) {
                if (chatInput.value) {
                    chatInput.value += " " + transcript;
                } else {
                    chatInput.value = transcript;
                }
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };
    }

    // Core TTS announcer
    function announceTTS(message) {
        console.log("Announcing TTS: ", message);
        if ('speechSynthesis' in window) {
            // Cancel current announcements
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechUtterance(message);
            utterance.lang = 'en-US';
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

    // Mock dictation simulation
    function simulateVoiceCommand() {
        const mockDictations = [
            "routing is completed",
            "optical power level is minus twenty",
            "override bend radius restriction",
            "no optical bend defects visible"
        ];
        const randomText = mockDictations[Math.floor(Math.random() * mockDictations.length)];
        voicePrompt.textContent = `Listening: "${randomText}" (Simulated)`;
        btnVoiceAgent.className = 'btn-voice active';
        voiceWaves.classList.add('active');
        
        setTimeout(() => {
            btnVoiceAgent.className = 'btn-voice inactive';
            voiceWaves.classList.remove('active');
            voicePrompt.textContent = "Hold mic button to dictate...";
            
            const chatInput = document.getElementById('chat-text-input');
            if (chatInput) {
                if (chatInput.value) {
                    chatInput.value += " " + randomText;
                } else {
                    chatInput.value = randomText;
                }
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
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
            announceTTS("Showing audit report summary.");
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
