// distortion-processor.js

class DistortionProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'amount', defaultValue: 1,  minValue: 0,  maxValue: 20 },
      { name: 'mix',    defaultValue: 1,  minValue: 0,  maxValue: 1  }
    ];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    const output = outputs[0][0];
    const amtArr = parameters.amount;
    const mixArr = parameters.mix;

    for (let i = 0; i < output.length; i++) {
      const x = input ? input[i] : 0;
      const amt = amtArr.length > 1 ? amtArr[i] : amtArr[0];
     
      const processed = Math.tanh(amt * x);
      const mix = mixArr.length > 1 ? mixArr[i] : mixArr[0];
      
      output[i] = x * (1 - mix) + processed * mix;
    }
    return true;
  }
}

registerProcessor('distortion-processor', DistortionProcessor);
