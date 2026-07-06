/**
 * Audio Player Worklet Client for FieldOps PWA.
 */
const FieldOpsAudioPlayer = (function() {
    let audioContext = null;
    let audioPlayerNode = null;

    async function start() {
        if (audioContext) return [audioPlayerNode, audioContext];
        
        console.log("Initializing AudioPlayer Worklet Node...");
        audioContext = new AudioContext({
            sampleRate: 24000
        });

        // Load processor modules
        await audioContext.audioWorklet.addModule('/js/pcm-processor.js');
        
        audioPlayerNode = new AudioWorkletNode(audioContext, 'pcm-player-processor');
        audioPlayerNode.connect(audioContext.destination);
        
        console.log("AudioPlayer Worklet Node initialized");
        return [audioPlayerNode, audioContext];
    }

    function stop() {
        if (audioContext) {
            audioContext.close();
            audioContext = null;
            audioPlayerNode = null;
            console.log("Audio player stopped");
        }
    }

    return {
        start: start,
        stop: stop
    };
})();
