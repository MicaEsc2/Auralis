class RobotProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [{ name: 'frequency', defaultValue: 0 }];
    }

    constructor() {
        super();
        this.phase = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0][0];
        const outputL = outputs[0][0];
        const outputR = outputs[0][1];        
        const freq = parameters.frequency;

        if (!input || !outputL || !outputR) return true;

        for (let i = 0; i < input.length; i++) {
            const f = freq.length > 1 ? freq[i] : freq[0];
            const mod = f === 0 ? 1 : Math.sin(this.phase);
            const outSample = input[i] * mod;
            outputL[i] = outSample;
            outputR[i] = outSample;            this.phase += 2 * Math.PI * f / sampleRate;  // ✅ usa sampleRate directamente
            if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;
        }

        return true;
    }
}

registerProcessor('robot-processor', RobotProcessor);
