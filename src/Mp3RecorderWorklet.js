// This exist only to feed audio data to our worker thread
class Mp3RecorderWorklet extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        if (inputs[0].length > 0) {
            this.port.postMessage(inputs[0]);
        }
        return true;
    }
}

registerProcessor('Mp3RecorderWorklet', Mp3RecorderWorklet);
