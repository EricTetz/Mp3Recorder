export class Mp3Recorder {
    async configure(inputNode, channels = 2, bitRate = 196) {
        if (channels < 1 || channels > 2) {
            throw new Error("Mp3Recorder only supports mono or stereo.");
        }

        this.inputNode = inputNode;

        // do this here rather than the constructor because we need the audio context
        if (this.worker == null) {
            let workerPath  = new URL('./Mp3RecorderWorker.js', import.meta.url);
            this.worker = new Worker(workerPath);

            let workletPath = new URL('./Mp3RecorderWorklet.js', import.meta.url);
            await inputNode.context.audioWorklet.addModule(workletPath);
            this.worklet = new AudioWorkletNode(inputNode.context, 'Mp3RecorderWorklet', {
                inputChannelCount: [ 2 ], // works for mono or stereo
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete',
            });

            this.worker.onmessage = e => {
                if (e.data.recordedSize != null) {
                    this.onRecordedSize?.(e.data.recordedSize);
                } else if (e.data.finishedRecording) {
                    this.onFinishedRecording?.(new Blob(e.data.finishedRecording, { type: 'audio/mp3' }));
                }
            }

            this.worklet.port.onmessage = e =>
                this.worker.postMessage({ message: 'receivedChannelData', channelData: e.data });
        }

        let config = { sampleRate: inputNode.context.sampleRate, bitRate, channels };
        this.worker.postMessage({message: 'init', config});
    }

    start() {
        if (!this.connected) {
            this.worker.postMessage({message: 'start'});
            this._connectAudioWorklet();
        }
    }

    pause() {
        this._disconnectAudioWorklet();
    }

    resume() {
        this._connectAudioWorklet();
    }

    async getRecordedSize() {
        return new Promise((accept, reject) => {
            this.onRecordedSize = accept;
            this.worker.postMessage({message: 'getRecordedSize'});
        });
    }

    stop() {
        this.worker.postMessage({message: 'stop'});
        this._disconnectAudioWorklet();
        return new Promise((accept, reject) => {
            this.onFinishedRecording = accept;
            this.worklet.port.postMessage({message: 'stop'});
        });
    }

    _disconnectAudioWorklet() {
        if (this.connected) {
            this.connected = this.inputNode.disconnect(this.worklet);
        }
    }

    _connectAudioWorklet() {
        if (!this.connected) {
            this.connected = this.inputNode.connect(this.worklet);
        }
    }
}
