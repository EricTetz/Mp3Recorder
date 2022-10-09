# Mp3Recorder

Record web audio to an MP3.

[Live demo]()

Supports all modern browsers.

## Usage

```js
    import { Mp3Recorder } from 'Mp3Recorder.mjs';

    let recorder = new Mp3Recorder('Mp3RecorderWorker.js', 'Mp3RecorderWorklet.js');
    await recorder.configure(inputAudioNode, 2, 196);

    recorder.start();

    // wait a bit...

    let mp3 = await recorder.stop();
```

## API

The code is in three parts:

`Mp3RecorderWorklet.js`: Tiny AudioWorkletProcessor that feeds raw audio to the worker.
`Mp3RecorderWorker.js`: Encodes audio in real time using LAME (inline in the file). We use a separate worker to avoid dropping frames during encoding (AudioWorkletProcessor has hard coded 128 byte buffer).
`Mp3Recorder.mjs`: Coordinates worker threads and provides an API for them. This is what you use in your code. The other files are necessary evils because of the way web threading works.

`Mp3Recorder` constructor(workerPath, workletPath)` parameters:

    `workerPath`: path to worker file (subject to vagaries of worker paths)
    `workletPath`: path to worklet file (subject to vagaries of worklet paths)

`async Mp3Recorder.configure(inputNode, channels, bitRate)` parameters:

    `inputNode`: the AudioNode whose output we'll record
    `channels`: 1 or 2 (mono or stereo)
    `bitRate`: bit rate to encode at

`async Mp3Recorder.stop()`

    Returns a Promise of an audio/mp3 blob.