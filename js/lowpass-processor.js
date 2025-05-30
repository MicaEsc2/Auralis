class LowpassProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'cutoff', defaultValue: 1000 },
            { name: 'mix', defaultValue: 1 }
        ];
    }

    constructor() {
        super();
        this.lastOut = 0;
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
            this.lastOut = a * input[i] + (1 - a) * this.lastOut;
            const outSample = input[i] * (1 - mix[0]) + this.lastOut * mix[0];
            outputL[i] = outSample;
            outputR[i] = outSample;        }

        return true;
    }
}

registerProcessor('lowpass-processor', LowpassProcessor);
