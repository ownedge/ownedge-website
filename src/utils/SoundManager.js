const CONFIG = {
    MASTER_VOL: 0.9,
    
    // Volume Multipliers per section
    BOOT_VOL: 0.9,       
    ATMOSPHERE_VOL: 0.2, 
    MUSIC_VOL: 0.2,      
    
    // Music Timing
    MUSIC_START_DELAY: 4500,     // Milliseconds before music starts after boot
    MUSIC_FADE_IN_DURATION: 6.0, // Seconds to fade in music
    
    // Boot Details
    BOOT_SPIN_DURATION: 3.0, 
    BOOT_SEEK_COUNT: 8
};

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.atmosphereOscillators = [];
        this.atmosphereGain = null;
        this.initialized = false;
        this.config = CONFIG;
    }

    init() {
        if (this.initialized) return;

        // Initialize Audio Context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Create Master Gain for Volume Control
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.config.MASTER_VOL;
        this.masterGain.connect(this.ctx.destination);

        this.initialized = true;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            return this.ctx.resume();
        }
        return Promise.resolve();
    }

    // --- Sound Effects ---
    
    playBootSequence() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const vol = this.config.BOOT_VOL;

        // 1. BIOS POST Beep (The classic single beep)
        const beepOsc = this.ctx.createOscillator();
        const beepGain = this.ctx.createGain();
        beepOsc.connect(beepGain);
        beepGain.connect(this.masterGain);

        beepOsc.type = 'sawtooth';
        beepOsc.frequency.setValueAtTime(800, t + 0.1); 
        
        beepGain.gain.setValueAtTime(0, t);
        beepGain.gain.setValueAtTime(0.1 * vol, t + 0.1);
        beepGain.gain.setValueAtTime(0, t + 0.25); // Short beep

        beepOsc.start(t);
        beepOsc.stop(t + 0.5);

        // 2. Hard Drive Spin Up (Mechanical Whine)
        const spinOsc = this.ctx.createOscillator();
        const spinGain = this.ctx.createGain();
        spinOsc.connect(spinGain);
        spinGain.connect(this.masterGain);

        spinOsc.type = 'sawtooth'; // Gritty motor sound
        spinOsc.frequency.setValueAtTime(40, t);
        spinOsc.frequency.exponentialRampToValueAtTime(300, t + this.config.BOOT_SPIN_DURATION * 0.8); 

        spinGain.gain.setValueAtTime(0, t);
        spinGain.gain.linearRampToValueAtTime(0.05 * vol, t + 0.5); // Fade in
        spinGain.gain.linearRampToValueAtTime(0, t + this.config.BOOT_SPIN_DURATION); // Fade out

        spinOsc.start(t);
        spinOsc.stop(t + this.config.BOOT_SPIN_DURATION);

        // 3. Disk Seek Chatter (Random pulses)
        const makeClick = (time) => {
            const clickOsc = this.ctx.createOscillator();
            const clickGain = this.ctx.createGain();
            clickOsc.connect(clickGain);
            clickGain.connect(this.masterGain);
            
            clickOsc.type = 'sawtooth';
            clickOsc.frequency.setValueAtTime(Math.random() * 30 + 100, time);
            
            clickGain.gain.setValueAtTime(0.05 * vol, time);
            clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            
            clickOsc.start(time);
            clickOsc.stop(time + 0.05);
        };

        // Rhythmic seeking pattern
        let seekTime = t + 0.5;
        for(let i=0; i<this.config.BOOT_SEEK_COUNT; i++) {
             makeClick(seekTime);
             seekTime += Math.random() * 0.1 + 0.05;
        }

        // 4. Transitions to Atmosphere
        setTimeout(() => {
            this.playAtmosphere();
        }, 2000);
    }

    playDecodeSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Grittier low data sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200 + Math.random() * 50, t); 
        
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.04);
    }

    playTypingSound() {
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High-tech blip: High pitch, very short decay
        // Randomize pitch slightly for "organic" feel
        const baseFreq = 800 + Math.random() * 20; // 800-850Hz range (much tighter)
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.type = 'square'; // Crisper "digital" click

        // Envelope: Instant attack, faster decay for sharpness
        gain.gain.setValueAtTime(0.01, t); // Slightly lower volume for square wave
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.03);
    }

    playHoverSound() {
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Chirp: Fast frequency sweep up
        osc.frequency.setValueAtTime(2000, t);
        osc.frequency.exponentialRampToValueAtTime(4000, t + 0.05); // Sweep up
        osc.type = 'triangle'; // Buzzier tone

        // Envelope
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.05);
    }

    playAtmosphere() {
        if (!this.ctx || this.isMuted || this.atmosphereOscillators.length > 0) return;

        // Create a dark ambient drone using two low-frequency oscillators
        this.atmosphereGain = this.ctx.createGain();
        this.atmosphereGain.gain.value = 0.0; // Start silent -> fade in
        this.atmosphereGain.connect(this.masterGain);

        // Osc 1: Mid-low drone (Higher pitch than sub-bass)
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(110, this.ctx.currentTime);
        
        // Filter 1: Lowpass 
        const filter1 = this.ctx.createBiquadFilter();
        filter1.type = 'lowpass';
        filter1.frequency.value = 300;
        osc1.connect(filter1);
        filter1.connect(this.atmosphereGain);

        // Osc 2: High harmonic
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(220, this.ctx.currentTime); 
        osc2.connect(this.atmosphereGain);

        // Start
        osc1.start();
        osc2.start();

        this.atmosphereOscillators = [osc1, osc2];

        // Fade in smoothly - Lower volume
        this.atmosphereGain.gain.setTargetAtTime(0.05 * this.config.ATMOSPHERE_VOL, this.ctx.currentTime, 2);
    }
    
    stopAtmosphere() {
         if (this.atmosphereGain) {
             const t = this.ctx.currentTime;
             this.atmosphereGain.gain.cancelScheduledValues(t);
             this.atmosphereGain.gain.setValueAtTime(this.atmosphereGain.gain.value, t);
             this.atmosphereGain.gain.exponentialRampToValueAtTime(0.001, t + 2);
             
             setTimeout(() => {
                 this.atmosphereOscillators.forEach(o => o.stop());
                 this.atmosphereOscillators = [];
             }, 2000);
         }
    }
    // --- 16-bit Soft Retro "Chill" Music Generator ---
    // Style: Elevator Music / RPG Town / Chillwave
    // Tempo: 90 BPM, Smooth envelopes, extended chords

    setupEffects() {
        if (!this.ctx || this.delayNode) return;
        
        // Music Bus for global music volume/fade control
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 1.0;
        this.musicGain.connect(this.masterGain);

        // Stereo Delay Line (Longer, softer echoes)
        this.delayNode = this.ctx.createDelay();
        this.delayNode.delayTime.value = 0.5; // dotted 8th feel approx
        
        this.delayFeedback = this.ctx.createGain();
        this.delayFeedback.gain.value = 0.3; 

        const delayFilter = this.ctx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 1200; // Very warm echoes

        this.fxBus = this.ctx.createGain();
        this.fxBus.gain.value = 1.0;
        
        // FX Bus now routes to Music Bus so it fades with music
        this.fxBus.connect(this.musicGain); 
        
        this.fxBus.connect(this.delayNode);
        this.delayNode.connect(delayFilter);
        delayFilter.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayNode);
        
        this.delayNode.connect(this.musicGain); // Delay output also to Music Bus
    }

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
        
        // Connect to Music Bus instead of Master
        if (this.musicGain) {
             panner.connect(this.musicGain);
        } else {
             panner.connect(this.masterGain);
        }
        
        if (this.fxBus) {
             panner.connect(this.fxBus);
        }

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
        
        if (this.musicGain) {
             panner.connect(this.musicGain);
        } else {
             panner.connect(this.masterGain);
        }
        
        if (this.fxBus) {
             panner.connect(this.fxBus);
        }

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
        
        if (this.musicGain) {
             gain.connect(this.musicGain);
        } else {
             gain.connect(this.masterGain);
        }
        
        noise.start(startTime);
    }

    startChillLoop() {
        if (!this.ctx || this.isMuted) return;
        //this.stopAtmosphere(); 
        this.setupEffects();
        
        // FADE IN MUSIC
        const fadeInDur = this.config.MUSIC_FADE_IN_DURATION;
        if (this.musicGain) {
            const t = this.ctx.currentTime;
            this.musicGain.gain.setValueAtTime(0, t);
            this.musicGain.gain.linearRampToValueAtTime(1.0, t + fadeInDur);
        }
        
        const vol = this.config.MUSIC_VOL; // Master scaler for music

        const bpm = 90; 
        const beatDur = 60 / bpm; 
        let beatCounter = 0;

        // Progression: Cmaj7 - Fmaj7 - Em7 - Am9
        const chords = [
            [261.63, 329.63, 392.00, 493.88], // Cmaj7
            [174.61, 220.00, 261.63, 329.63], // Fmaj7
            [164.81, 196.00, 246.94, 293.66], // Em7
            [220.00, 261.63, 329.63, 392.00]  // Am7
        ];
        
        const roots = [65.41, 43.65, 41.20, 55.00];

        this.jazzInterval = setInterval(() => {
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            
            const bar = Math.floor(beatCounter / 4);
            const beat = beatCounter % 4;
            const chordIdx = bar % 4;
            const currentChord = chords[chordIdx];

            // 1. Lush Pads (Beat 1)
            if (beat === 0) {
                currentChord.forEach((freq, i) => {
                    this.playPad(freq, t + (i*0.05), beatDur * 4, 0.02 * vol);
                });
                // Bass (Reduced volume)
                this.playPad(roots[chordIdx], t, beatDur * 4, 0.06 * vol);
            }

            // 2. Soft Lead Melody (Pentatonic wandering)
            // Play sparse notes
            if (Math.random() > 0.4) {
                const note = currentChord[Math.floor(Math.random() * currentChord.length)] * 2; 
                const offset = (Math.random() > 0.5) ? beatDur / 2 : 0; 
                this.playSoftLead(note, t + offset, beatDur, 0.03 * vol); 
            }

            // 3. Brush Drums
            if (beat % 2 === 0) {
                 this.playBrush(t, 0.015 * vol);
            } else {
                 this.playBrush(t, 0.02 * vol);
            }

            beatCounter++;
        }, beatDur * 1000);
    }
}


export default new SoundManager();
