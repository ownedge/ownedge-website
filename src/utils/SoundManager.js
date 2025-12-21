class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.atmosphereOscillators = [];
        this.atmosphereGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        // Initialize Audio Context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Create Master Gain for Volume Control
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Default volume
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

        // 1. BIOS POST Beep (The classic single beep)
        const beepOsc = this.ctx.createOscillator();
        const beepGain = this.ctx.createGain();
        beepOsc.connect(beepGain);
        beepGain.connect(this.masterGain);

        beepOsc.type = 'square';
        beepOsc.frequency.setValueAtTime(800, t + 0.1); 
        
        beepGain.gain.setValueAtTime(0, t);
        beepGain.gain.setValueAtTime(0.1, t + 0.1);
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
        spinOsc.frequency.exponentialRampToValueAtTime(300, t + 2.5); // Spin up

        spinGain.gain.setValueAtTime(0, t);
        spinGain.gain.linearRampToValueAtTime(0.05, t + 0.5); // Fade in
        spinGain.gain.linearRampToValueAtTime(0, t + 3.0); // Fade out

        spinOsc.start(t);
        spinOsc.stop(t + 3.0);

        // 3. Disk Seek Chatter (Random pulses)
        const makeClick = (time) => {
            const clickOsc = this.ctx.createOscillator();
            const clickGain = this.ctx.createGain();
            clickOsc.connect(clickGain);
            clickGain.connect(this.masterGain);
            
            clickOsc.type = 'square';
            clickOsc.frequency.setValueAtTime(Math.random() * 500 + 100, time);
            
            clickGain.gain.setValueAtTime(0.05, time);
            clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            
            clickOsc.start(time);
            clickOsc.stop(time + 0.05);
        };

        // Rhythmic seeking pattern
        let seekTime = t + 0.5;
        for(let i=0; i<8; i++) {
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
        gain.gain.setValueAtTime(0.03, t); // Slightly lower volume for square wave
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

        // Osc 1: Deep sub-bass (50-60Hz)
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, this.ctx.currentTime);
        
        // Filter 1: Lowpass to remove harshness
        const filter1 = this.ctx.createBiquadFilter();
        filter1.type = 'lowpass';
        filter1.frequency.value = 120;
        osc1.connect(filter1);
        filter1.connect(this.atmosphereGain);

        // Osc 2: Slightly detuned harmonic (110Hz)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(112, this.ctx.currentTime); // Detuned slightly
        osc2.connect(this.atmosphereGain);

        // Start
        osc1.start();
        osc2.start();

        this.atmosphereOscillators = [osc1, osc2];

        // Fade in smoothly over 5s
        this.atmosphereGain.gain.setTargetAtTime(0.15, this.ctx.currentTime, 2);
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
}

export default new SoundManager();
