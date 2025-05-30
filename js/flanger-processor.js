// flanger-processor.js
class FlangerProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
        { name: 'depth', defaultValue: 0.003, minValue: 0,  maxValue: 0.1 },  // 0–50 ms
        { name:   'rate', defaultValue: 0.25,  minValue: 0,  maxValue: 10   },  // 0–10 Hz
        { name:    'mix', defaultValue: 0.5,   minValue: 0,  maxValue: 1    },

    ];
  }

  constructor() {
    super();
    this.buffer = new Float32Array(48000);
    this.writeIndex = 0;
    this.lfoPhase = 0;
  }

  process(inputs, outputs, parameters) {
    const input  = inputs[0][0] || new Float32Array(outputs[0][0].length);
    const output = outputs[0][0];
    const sr     = sampleRate;
    const depthArr = parameters.depth;
    const rateArr  = parameters.rate;
    const mixArr   = parameters.mix;

    for (let i = 0; i < output.length; i++) {
      const x = input[i];

      this.buffer[this.writeIndex] = x;

      const depth = depthArr.length > 1 ? depthArr[i] : depthArr[0];
      const rate  = rateArr.length > 1  ? rateArr[i]  : rateArr[0];
      
      // LFO: sinusoide
      const lfo = Math.sin(this.lfoPhase);

      // tiempo de delay en muestras
      const delaySamples = depth * sr * (0.5 + 0.5* lfo);

     
      let readPos = this.writeIndex - delaySamples;
      if (readPos < 0) readPos += this.buffer.length;
      const i0 = Math.floor(readPos);
      const i1 = (i0 + 1) % this.buffer.length;
      const frac = readPos - i0;
      const delayed = this.buffer[i0] * (1 - frac) + this.buffer[i1] * frac;

      // mezcla dry/wet
      const mix = mixArr.length > 1 ? mixArr[i] : mixArr[0];
      output[i] = x * (1 - mix) + delayed * mix;

   
      this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
      this.lfoPhase += 2 * Math.PI * rate / sr;
      if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
    }

    return true;
  }
}
registerProcessor('flanger-processor', FlangerProcessor);

