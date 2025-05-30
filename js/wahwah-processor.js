
class WahWahProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
        { name:  'minFreq', defaultValue: 500,  minValue: 300,  maxValue: 1000 },
        { name:  'maxFreq', defaultValue: 3000, minValue: 1000, maxValue: 5000 },
        { name:     'rate', defaultValue: 1,    minValue: 0,    maxValue: 10   },  // 0–10 Hz
        { name:       'Q', defaultValue: 1,    minValue: 0.1,  maxValue: 20   },
        { name:     'mix', defaultValue: 0.5,  minValue: 0,    maxValue: 1    },
    ];
  }

  constructor() {
    super();
    this.z1 = this.z2 = this.y1 = this.y2 = 0;
    this.lfoPhase = 0;
  }

  process(inputs, outputs, parameters) {
    const input  = inputs[0][0] || new Float32Array(outputs[0][0].length);
    const output = outputs[0][0];
    const sr       = sampleRate;
    const minArr   = parameters.minFreq;
    const maxArr   = parameters.maxFreq;
    const rateArr  = parameters.rate;
    const Qarr     = parameters.Q;
    const mixArr   = parameters.mix;

    for (let i = 0; i < output.length; i++) {
      const x = input[i];
      const rate = rateArr.length > 1 ? rateArr[i] : rateArr[0];
      const minF = minArr.length > 1 ? minArr[i] : minArr[0];
      const maxF = maxArr.length > 1 ? maxArr[i] : maxArr[0];

      // LFO oscilante entre 0 y 1
      const lfo = 0.5 * (1 + Math.sin(this.lfoPhase));
      // frecuencia central
      const Fc = minF + lfo * (maxF - minF);
      const w0 = 2 * Math.PI * Fc / sr;
      const alpha = Math.sin(w0) / (2 * (Qarr.length > 1 ? Qarr[i] : Qarr[0]));

      // coeficientes band-pass 
      const b0 = alpha;
      const b1 = 0;
      const b2 = -alpha;
      const a0 = 1 + alpha;
      const a1 = -2 * Math.cos(w0);
      const a2 = 1 - alpha;

      // ecuación diferencia biquad
      const y = (b0/a0)*x + (b1/a0)*this.z1 + (b2/a0)*this.z2
                - (a1/a0)*this.y1 - (a2/a0)*this.y2;

      // desplazar retardos
      this.z2 = this.z1;
      this.z1 = x;
      this.y2 = this.y1;
      this.y1 = y;

      // mezcla dry/wet
      const mix = mixArr.length > 1 ? mixArr[i] : mixArr[0];
      output[i] = x * (1 - mix) + y * mix;

      // avanzar fase LFO
      this.lfoPhase += 2 * Math.PI * rate / sr;
      if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
    }

    return true;
  }
}
registerProcessor('wahwah-processor', WahWahProcessor);
