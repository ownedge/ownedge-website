import ChillSong from './ChillSong';
import EnergeticSong from './EnergeticSong';
import FlowSong from './FlowSong';

const CONFIG = {
    MASTER_VOL: 0.9,
    
    // Volume Multipliers per section
    BOOT_VOL: 0.9,       
    ATMOSPHERE_VOL: 0.03,
    MUSIC_VOL: 0.18,      
    
    // Music Timing
    MUSIC_START_DELAY: 5500,     // Milliseconds before music starts after boot
    MUSIC_FADE_IN_DURATION: 5.0, // Seconds to fade in music
    
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
        osc.frequency.setValueAtTime(200 + Math.random() * 20, t); 
        
        gain.gain.setValueAtTime(0.005, t);
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
        const baseFreq = 9500 + Math.random() * 20; // 800-850Hz range (much tighter)
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.type = 'square'; // Crisper "digital" click

        // Envelope: Instant attack, faster decay for sharpness
        gain.gain.setValueAtTime(0.005, t); // Slightly lower volume for square wave
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

    playErrorSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        
        // Classic "Error" square wave burst
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.3); // Pitch down
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        
        osc.start(t);
        osc.stop(t + 0.3);
    }

    playSparkleSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        
        // Magical sparkle: Multiple ascending tones with shimmer
        const frequencies = [1200, 1600, 2000, 2400, 3000];
        
        frequencies.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine'; // Pure, bell-like tone
            osc.frequency.setValueAtTime(freq, t + i * 0.08);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.2, t + i * 0.08 + 0.15); // Slight pitch rise
            
            // Envelope: Quick attack, gentle decay
            gain.gain.setValueAtTime(0, t + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.03, t + i * 0.08 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.35);
        });
    }

    playAtmosphere() {
        if (!this.ctx || this.isMuted || this.atmosphereOscillators.length > 0) return;

        // Create a dark ambient drone using two low-frequency oscillators
        this.atmosphereGain = this.ctx.createGain();
        this.atmosphereGain.gain.value = 0.0; // Start silent -> fade in
        this.atmosphereGain.connect(this.masterGain);

        // Osc 1: Mid-low drone (Higher pitch than sub-bass)
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(110, this.ctx.currentTime);
        
        // Filter 1: Lowpass 
        const filter1 = this.ctx.createBiquadFilter();
        filter1.type = 'highpass';
        filter1.frequency.value = 300;
        osc1.connect(filter1);
        filter1.connect(this.atmosphereGain);

        // Osc 2: High harmonic
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sawtooth';
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

    playHddSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;

        // Create noise buffer
        const bufferSize = this.ctx.sampleRate * 0.05; // 50ms buffer
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter for "click" characteristic (Bandpass)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2800 + Math.random() * 500; // High pitch mechanical tick
        filter.Q.value = 7.0;

        const gain = this.ctx.createGain();
        // Very quite, subtle click
        gain.gain.setValueAtTime(0.005, t); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
    }

    // --- 16-bit Soft Retro "Chill" Music Generator ---
    // Style: Elevator Music / RPG Town / Chillwave
    // Tempo: 90 BPM, Smooth envelopes, extended chords

    // --- Music System ---
    
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

    startMusicRotation() {
        if (!this.ctx || this.isMuted) return;
        this.setupEffects();
        
        // Initialize playlist
        this.playlist = [new ChillSong(), new FlowSong(), new EnergeticSong()];
        this.currentSongIndex = 0;
        this.currentSongInstance = null;
        this.currentSongGain = null;

        // FADE IN INITIAL SONG
        const fadeInDur = this.config.MUSIC_FADE_IN_DURATION;
        if (this.musicGain) {
            const t = this.ctx.currentTime;
            this.musicGain.gain.setValueAtTime(0, t);
            this.musicGain.gain.linearRampToValueAtTime(this.config.MUSIC_VOL, t + fadeInDur);
        }

        // Start first song
        this.playSong(this.playlist[0]);

        // Schedule rotation every 60 seconds
        setInterval(() => {
            this.rotateSong();
        }, 30000); 
    }

    playSong(songInstance) {
        if (!this.ctx) return;
        
        // Create a specific gain node for this song to allow crossfading
        const songGain = this.ctx.createGain();
        songGain.connect(this.musicGain); // Connect to main music bus
        
        // Start full volume (global music bus handles the master fade-in)
        songGain.gain.value = 1.0; 

        songInstance.start(this.ctx, songGain);
        
        this.currentSongInstance = songInstance;
        this.currentSongGain = songGain;
    }

    rotateSong() {
        if (!this.ctx) return;
        
        const nextIndex = (this.currentSongIndex + 1) % this.playlist.length;
        const nextSong = this.playlist[nextIndex];
        const prevSongInstance = this.currentSongInstance;
        const prevSongGain = this.currentSongGain;

        // 1. Prepare Next Song
        const nextSongGain = this.ctx.createGain();
        nextSongGain.connect(this.musicGain);
        nextSongGain.gain.value = 0; // Start silent

        nextSong.start(this.ctx, nextSongGain);

        // 2. Crossfade (10 seconds)
        const t = this.ctx.currentTime;
        const fadeDur = 10;

        // Fade out old
        if (prevSongGain) {
            prevSongGain.gain.setValueAtTime(1, t);
            prevSongGain.gain.linearRampToValueAtTime(0, t + fadeDur);
        }

        // Fade in new
        nextSongGain.gain.setValueAtTime(0, t);
        nextSongGain.gain.linearRampToValueAtTime(1, t + fadeDur);

        // 3. Update State
        this.currentSongInstance = nextSong;
        this.currentSongGain = nextSongGain;
        this.currentSongIndex = nextIndex;

        // 4. Cleanup Old Song
        setTimeout(() => {
            if (prevSongInstance) prevSongInstance.stop();
            // Old gain node will be garbage collected once disconnected/dereferenced
        }, fadeDur * 1000 + 100);
    }
}


export default new SoundManager();
