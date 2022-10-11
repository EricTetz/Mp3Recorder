# Mp3Recorder

Record web audio to an MP3 in mono or stereo.

[Live demo.](https://erictetz.github.io/Mp3Recorder/)

Supports all modern browsers.

## API

```js
    import { Mp3Recorder } from './src/Mp3Recorder.mjs';

    let recorder = new Mp3Recorder();

    await recorder.configure(inputAudioNode, channels, bitRate);

    recorder.start();

    recorder.pause();

    recorder.resume();

    let bytes = await recorder.getRecordedSize();

    let mp3 = await recorder.stop();
```

## Installation

Copy the files in `src` into your project.

* **Mp3RecorderWorklet.js**: tiny AudioWorkletProcessor that feeds raw audio to the worker.
* **Mp3RecorderWorker.js**: encodes audio in real time (using [lamejs](https://github.com/zhuker/lamejs), inline in the file). We use a separate worker to avoid dropping frames during encoding (AudioWorkletProcessor has hard coded 128 byte buffer).
* **Mp3Recorder.mjs**: coordinates worker threads and provides an API for them. This is what you use in your code. The other files are necessary evils because of the way web threading works.

## API Details

`Mp3Recorder()`

You should only create one instance of Mp3Recorder to avoid proliferation of worker threads.

`async configure(inputNode, channels, bitRate)`:

This can be called as many times as you want to change the audio node being recorded or to reconfigure the encoder.

* `inputNode`: the AudioNode whose output we'll record
* `channels`: 1 or 2 (mono or stereo)
* `bitRate`: bit rate to encode at

`start()`

Start recording.

`pause()`

Pause recording.

` resume()`

Resume recording after it's been paused.

`async getRecordedSize()`

Return the number of bytes recorded so far.

`async stop()`

Stop recording and return the MP3 blob.
