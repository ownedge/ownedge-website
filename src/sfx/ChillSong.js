export default class ChillSong {
    constructor() {
        this.ctx = null;
        this.output = null;
        this.interval = null;
        this.bpm = 90;
    }

    start(ctx, output) {
        this.ctx = ctx;
        this.output = output;

        const beatDur = 60 / this.bpm; 
        let beatCounter = 0;

        // Progression: Cmaj7 - Fmaj7 - Em7 - Am9
        const chords = [
            [261.63, 329.63, 392.00, 493.88], // Cmaj7
            [174.61, 220.00, 261.63, 329.63], // Fmaj7
            [164.81, 196.00, 246.94, 293.66], // Em7
            [220.00, 261.63, 329.63, 392.00]  // Am7
        ];
        
        const roots = [65.41, 43.65, 41.20, 55.00];

        this.interval = setInterval(() => {
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            
            const bar = Math.floor(beatCounter / 4);
            const beat = beatCounter % 4;
            const chordIdx = bar % 4;
            const currentChord = chords[chordIdx];

            // 1. Lush Pads (Beat 1)
            if (beat === 0) {
                currentChord.forEach((freq, i) => {
                    this.playPad(freq, t + (i*0.05), beatDur * 4, 0.02);
                });
                // Bass (Reduced volume)
                this.playPad(roots[chordIdx], t, beatDur * 4, 0.06);
            }

            // 2. Soft Lead Melody (Pentatonic wandering)
            // Play sparse notes
            if (Math.random() > 0.4) {
                const note = currentChord[Math.floor(Math.random() * currentChord.length)] * 2; 
                const offset = (Math.random() > 0.5) ? beatDur / 2 : 0; 
                this.playSoftLead(note, t + offset, beatDur, 0.03); 
            }

            // 3. Brush Drums
            if (beat % 2 === 0) {
                 this.playBrush(t, 0.015);
            } else {
                 this.playBrush(t, 0.02);
            }

            beatCounter++;
        }, beatDur * 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    // --- INSTRUMENTS ---

    playPad(freq, startTime, duration, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Sine/Triangle mix for "flute-like" pad
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        
        const panner = this.ctx.createStereoPanner();
        // Gentle random wander for pads
        panner.pan.value = (Math.random() * 0.4) - 0.2; 

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.output);
        
        // Slow Attack / Release Envelope (The "Soft" part)
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + (duration * 0.4));
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playSoftLead(freq, startTime, duration, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine'; // Pure tone
        osc.frequency.setValueAtTime(freq, startTime);

        const panner = this.ctx.createStereoPanner();
        panner.pan.value = 0;

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.output);

        // Bell-like envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playBrush(startTime, vol=0.05) {
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        // Soften the noise
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800; 

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        
        noise.start(startTime);
    }
}
