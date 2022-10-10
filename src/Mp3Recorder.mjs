export class Mp3Recorder {
    static workerPath = undefined;
    static workletPath = undefined;

    constructor(workerPath = 'Mp3RecorderWorker.js', workletPath = 'Mp3RecorderWorklet.js') {

        if (Mp3Recorder.workerPath != null) {
            throw new Error("Don't create more than one instance of Mp3Recorder.");
        }

        Mp3Recorder.workerPath = workerPath;
        Mp3Recorder.workletPath = workletPath;
    }

    async configure(inputNode, channels = 2, bitRate = 196) {
        if (channels < 1 || channels > 2) {
            throw new Error("Mp3Recorder only supports mono or stereo.");
        }

        this.inputNode = inputNode;

        // do this here rather than the constructor because we need the audio context
        if (this.worker == null) {
            this.worker = new Worker(Mp3Recorder.workerPath);

            await inputNode.context.audioWorklet.addModule(`${Mp3Recorder.workletPath}?t=${Date.now()}`); // cache buster for Chrome
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
        this.worker.postMessage({message: 'start'});
        this.connected = this.inputNode.connect(this.worklet);
    }

    pause() {
        this.connected = this.inputNode.disconnect(this.worklet);
    }

    resume() {
        this.connected = this.inputNode.connect(this.worklet);
    }

    async getRecordedSize() {
        return new Promise((accept, reject) => {
            this.onRecordedSize = accept;
            this.worker.postMessage({message: 'getRecordedSize'});
        });
    }

    stop() {
        this.worker.postMessage({message: 'stop'});
        if (this.connected) {
            this.inputNode.disconnect(this.worklet);
        }
        return new Promise((accept, reject) => {
            this.onFinishedRecording = accept;
            this.worklet.port.postMessage({message: 'stop'});
        });
    }
}
