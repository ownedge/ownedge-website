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

            // 1. KICK (Four on the floor: 0, 4, 8, 12)
            if (sixteenths % 4 === 0) {
                this.playKick(t, 0.12); // Steady thump
            }

            // 2. SNARE (Backbeat: 4, 12)
            if (sixteenths % 16 === 4 || sixteenths % 16 === 12) {
                 this.playSnare(t, 0.08); // Crisp snap
            }

            // 3. HI-HATS (16th notes)
            // Off-beats (2, 6, 10, 14) are Open, On-beats are Closed
            const isOffBeat = (sixteenths % 4 === 2);
            if (sixteenths % 2 === 0) {
                // Main 8th notes
                 this.playHat(t, isOffBeat ? 0.025 : 0.012, isOffBeat);
            } else {
                // Ghost notes (16th fillers)
                if (Math.random() > 0.5) {
                    this.playHat(t, 0.005); 
                }
            }

            // 4. BASS (Off-beat groove to lock with Kick)
            // Play on the "and" of the beat or syncopated
            // Pattern: x-x- x-x- (approx)
            if (sixteenths % 4 !== 0) { // Don't play on the Kick
                if (sixteenths % 2 === 0) { // 8th note off-beats
                     const octave = (sixteenths % 8 === 2) ? 1 : 2;
                     this.playBass(roots[chordIdx] * octave, t, beatDur * 0.4, 0.06);
                }
            }

            // 5. Arpeggio (16th notes)
            const arpIdx = sixteenths % 4; 
            const arpNote = currentChord[arpIdx] * 2; 
            this.playArp(arpNote, t, sixteenthDur, 0.03); 

            // 6. Pad Support
            if (sixteenths % 16 === 0) {
                 currentChord.forEach((freq, i) => {
                    this.playPad(freq, t, beatDur * 4, 0.02);
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

    playKick(startTime, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, startTime + 0.5);

        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(this.output);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
    }

    playSnare(startTime, vol=0.1) {
        // Noise
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(vol, startTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.output);
        noise.start(startTime);

        // Body (Tone)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, startTime);
        oscGain.gain.setValueAtTime(vol * 0.5, startTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
        
        osc.connect(oscGain);
        oscGain.connect(this.output);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
    }

    playBass(freq, startTime, duration, vol=0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth'; // Back to Sawtooth for distinct bass tone (Kick handles "thump")
        osc.frequency.setValueAtTime(freq, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, startTime); 
        filter.frequency.exponentialRampToValueAtTime(100, startTime + duration); 

        gain.gain.setValueAtTime(vol, startTime); 
        gain.gain.linearRampToValueAtTime(vol * 0.8, startTime + 0.02); // Sustain slightly
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
        const filter = this.ctx.createBiquadFilter(); 
        
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(freq, startTime);
        
        filter.type = 'lowpass';
        filter.frequency.value = 1200; 
        
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
        filter.frequency.value = 6000; 

        const gain = this.ctx.createGain();
        const duration = open ? 0.08 : 0.02; // Shorter closed, longer open

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
