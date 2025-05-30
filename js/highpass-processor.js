class HighpassProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'cutoff', defaultValue: 500 },
            { name: 'mix', defaultValue: 1 }
        ];
    }

    constructor() {
        super();
        this.lastLow = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0][0];
        const outputL = outputs[0][0];
        const outputR = outputs[0][1];
        const cutoff = parameters.cutoff;
        const mix = parameters.mix;

        if (!input || !outputL || !outputR) return true;

        const alpha = (freq, sampleRate) => {
            const rc = 1 / (2 * Math.PI * freq);
            const dt = 1 / sampleRate;
            return dt / (rc + dt);
        };

        const a = alpha(cutoff[0], sampleRate);

        for (let i = 0; i < input.length; i++) {
            const low = a * input[i] + (1 - a) * this.lastLow;
            const high = input[i] - low;
            const outSample = input[i] * (1 - mix[0]) + high * mix[0];
            outputL[i] = outSample;
            outputR[i] = outSample;            
            this.lastLow = low;
        }

        return true;
    }
}

registerProcessor('highpass-processor', HighpassProcessor);
