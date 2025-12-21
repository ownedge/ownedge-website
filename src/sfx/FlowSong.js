export default class FlowSong {
    constructor() {
        this.ctx = null;
        this.output = null;
        this.interval = null;
        this.bpm = 100; // Bridge betwen 90 (Chill) and 110 (Energetic)
    }

    start(ctx, output) {
        this.ctx = ctx;
        this.output = output;

        const beatDur = 60 / this.bpm; 
        const sixteenthDur = beatDur / 4;
        let beatCounter = 0;

        // Unified Progression: Cmaj7 - Fmaj7 - Em7 - Am9
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
            
            const sixteenths = beatCounter;
            const beat = Math.floor(sixteenths / 4) % 4;
            const bar = Math.floor(sixteenths / 16);
            const chordIdx = bar % 4;
            const currentChord = chords[chordIdx];

            // 1. Deep Sub Bass (Sustained notes)
            // Play on Heat 1 of every bar
            if (sixteenths % 16 === 0) {
                 this.playSubBass(roots[chordIdx], t, beatDur * 4, 0.1);
            }

            // 2. Rhythmic Stabs (Electric Piano style)
            // Off-beat syncopation (Example: 3, 6, 11, 14)
            const stepInBar = sixteenths % 16;
            if ([3, 6, 11, 14].includes(stepInBar)) {
                 currentChord.forEach((freq, i) => {
                     // play distinct notes slightly spread
                     this.playKeys(freq, t + i*0.01, beatDur, 0.04);
                 });
            }

            // 3. Glassy Melody (Sparse)
            if (Math.random() > 0.85 && sixteenths % 2 === 0) {
                 const note = currentChord[Math.floor(Math.random() * currentChord.length)] * 2;
                 this.playGlass(note, t, beatDur * 2, 0.05);
            }

            // 4. Minimal Percussion (Clicks and Rims)
            if (beat === 1 || beat === 3) {
                 // Rimshot on 2 and 4
                 if (sixteenths % 4 === 0) this.playRim(t, 0.06);
            }
            if (stepInBar === 0 || stepInBar === 10) {
                 // Soft kick
                 this.playKick(t, 0.1);
            }
            // Fast shaker 16ths
            if (sixteenths % 2 === 0) {
                this.playShaker(t, 0.015);
            }

            beatCounter++;
        }, sixteenthDur * 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    // --- INSTRUMENTS ---

    playSubBass(freq, startTime, duration, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine'; // Pure sub
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.output);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playKeys(freq, startTime, duration, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle'; // E-Pianoish
        osc.frequency.setValueAtTime(freq, startTime);
        
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = (Math.random() * 0.8) - 0.4;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Short decay

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.output);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playGlass(freq, startTime, duration, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        // Bell envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.output);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playKick(startTime, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.frequency.setValueAtTime(120, startTime);
        osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);
        
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
    }

    playRim(startTime, vol=0.06) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, startTime);
        
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        osc.start(startTime);
        osc.stop(startTime + 0.05);
    }

    playShaker(startTime, vol=0.015) {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000; 

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        
        noise.start(startTime);
    }
}
