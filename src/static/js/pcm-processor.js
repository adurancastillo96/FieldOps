/**
 * AudioWorklet Processors for FieldOps.
 * Registers both the PCM player (24kHz output) and PCM recorder (16kHz input).
 */

class PCMPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Buffer size for 24kHz x 180 seconds ring buffer
    this.bufferSize = 24000 * 180;
    this.buffer = new Float32Array(this.bufferSize);
    this.writeIndex = 0;
    this.readIndex = 0;

    // Listen for incoming PCM data from the main thread
    this.port.onmessage = (event) => {
      // Clear buffer on stop/barge-in command
      if (event.data.command === 'endOfAudio') {
        this.readIndex = this.writeIndex; // Align read with write pointer (clears audio)
        console.log("[Player Worklet] endOfAudio received, clearing buffer.");
        return;
      }

      // Convert the incoming ArrayBuffer of Int16 samples
      const int16Samples = new Int16Array(event.data);
      this._enqueue(int16Samples);
    };
  }

  _enqueue(int16Samples) {
    for (let i = 0; i < int16Samples.length; i++) {
      // Scale 16-bit integer back to [-1, 1] Float32 range
      const floatVal = int16Samples[i] / 32768;

      this.buffer[this.writeIndex] = floatVal;
      this.writeIndex = (this.writeIndex + 1) % this.bufferSize;

      // Handle overflow
      if (this.writeIndex === this.readIndex) {
        this.readIndex = (this.readIndex + 1) % this.bufferSize;
      }
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const framesPerBlock = output[0].length;

    for (let frame = 0; frame < framesPerBlock; frame++) {
      const sample = this.buffer[this.readIndex];
      output[0][frame] = sample; // Left channel (mono)
      if (output.length > 1) {
        output[1][frame] = sample; // Right channel (mono duplicate)
      }

      // Move forward unless buffer is empty (readIndex == writeIndex)
      if (this.readIndex !== this.writeIndex) {
        this.readIndex = (this.readIndex + 1) % this.bufferSize;
      }
    }

    return true;
  }
}

class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    if (inputs.length > 0 && inputs[0].length > 0) {
      // Capture first input channel
      const inputChannel = inputs[0][0];
      // Post a copy to avoid recycling memory reference issues
      this.port.postMessage(new Float32Array(inputChannel));
    }
    return true;
  }
}

registerProcessor('pcm-player-processor', PCMPlayerProcessor);
registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);
