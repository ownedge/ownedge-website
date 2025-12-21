export default class EnergeticSong {
    constructor() {
        this.ctx = null;
        this.output = null;
        this.interval = null;
        this.bpm = 110; // Faster tempo
    }

    start(ctx, output) {
        this.ctx = ctx;
        this.output = output;

        const beatDur = 60 / this.bpm; 
        let beatCounter = 0;

        // Same harmonic progression for cohesion but different vibe
        // Cmaj7 - Fmaj7 - Em7 - Am9
        const chords = [
            [261.63, 329.63, 392.00, 493.88], // Cmaj7
            [174.61, 220.00, 261.63, 329.63], // Fmaj7
            [164.81, 196.00, 246.94, 293.66], // Em7
            [220.00, 261.63, 329.63, 392.00]  // Am7
        ];
        
        const roots = [65.41, 43.65, 41.20, 55.00];

        // 16th note resolution for arpeggios
        const sixteenthDur = beatDur / 4;

        this.interval = setInterval(() => {
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            
            const sixteenths = beatCounter;
            const beat = Math.floor(sixteenths / 4) % 4;
            const bar = Math.floor(sixteenths / 16);
            const chordIdx = bar % 4;
            const currentChord = chords[chordIdx];

            // 1. Driving Bass (Play on 8th notes: 0, 2)
            if (sixteenths % 2 === 0) {
                // Octave toggle for energy
                const octave = (sixteenths % 4 === 0) ? 1 : 2;
                this.playBass(roots[chordIdx] * octave, t, beatDur * 0.5, 0.08); // Reduced from 0.15
            }

            // 2. Arpeggio (16th notes)
            // Up/Down pattern
            const arpIdx = sixteenths % 4; 
            const arpNote = currentChord[arpIdx] * 2; // Higher octave
            this.playArp(arpNote, t, sixteenthDur, 0.04); // Reduced from 0.08

            // 3. Hi-Hats (White Noise) - Closed hat on every 8th, Open on off-beats occasionally
            if (sixteenths % 2 === 0) {
                this.playHat(t, 0.025); // Reduced from 0.04
            } else if (Math.random() > 0.7) {
                this.playHat(t, 0.05, true); // Reduced from 0.08
            }

            // 4. Pad Support (Every bar start)
            if (sixteenths % 16 === 0) {
                 currentChord.forEach((freq, i) => {
                    this.playPad(freq, t, beatDur * 4, 0.03);
                });
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

    playBass(freq, startTime, duration, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth'; // Gritty bass
        osc.frequency.setValueAtTime(freq, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, startTime);
        filter.frequency.exponentialRampToValueAtTime(100, startTime + duration); // Filter envelope

        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playArp(freq, startTime, duration, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter(); // Add filter for smoothness
        
        osc.type = 'triangle'; // Smoother tone than square
        osc.frequency.setValueAtTime(freq, startTime);
        
        filter.type = 'lowpass';
        filter.frequency.value = 1500; // Cut high fizz
        
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = (Math.random() * 0.6) - 0.3; 

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.output);

        // Plucky envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playHat(startTime, vol=0.05, open=false) {
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
        filter.frequency.value = 4000; 

        const gain = this.ctx.createGain();
        const duration = open ? 0.1 : 0.03;

        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        
        noise.start(startTime);
    }

    playPad(freq, startTime, duration, vol=0.1) {
        // Reuse Pad from ChillSong but maybe simpler texturing
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = (Math.random() * 0.4) - 0.2; 

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.output);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    }
}
