import { SYSTEM_CONFIG } from '../config';
import { reactive } from 'vue';

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.atmosphereOscillators = [];
        this.atmosphereGain = null;
        this.initialized = false;
        this.config = SYSTEM_CONFIG.AUDIO; // Helper alias
        this.userVolume = SYSTEM_CONFIG.AUDIO.MASTER_VOL;
        this.dialUpAnalyser = null;
        this.playlist = [
            '/sfx/music.mod',
            '/sfx/atmosphere.mod',
        ];
        // Internal reactive state for UI
        this.state = reactive({
            isMusicPlaying: false,
            currentSongIndex: 0
        });
    }

    init() {
        if (this.initialized) return;

        // Initialize Audio Context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 512; // Higher res for better VFD visualization (256 bins)
        this.analyser.smoothingTimeConstant = 0.85;

        // Create Master Gain for Volume Control
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.userVolume; // Apply stored volume
        
        // Create Music Gain (Sub-mix)
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.config.MUSIC_VOL;
        this.musicGain.connect(this.masterGain);

        // Connect Graph: Master -> Analyser -> Destination
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        this.initialized = true;
    }

    getAudioData() {
        if (!this.analyser) return null;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    getDialUpAudioData() {
        if (!this.dialUpAnalyser) return null;
        const bufferLength = this.dialUpAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.dialUpAnalyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            return this.ctx.resume();
        }
        return Promise.resolve();
    }

    setMasterVolume(value) {
        // Clamp value between 0 and 1
        const vol = Math.max(0, Math.min(1, value));
        this.userVolume = vol; // Store for later init or re-init
        
        if (this.masterGain && this.ctx) {
            // Use setValueAtTime for immediate, absolute update
            const t = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(t);
            this.masterGain.gain.setValueAtTime(vol, t);
        }
    }

    // --- Sound Effects ---
    
    playBootSequence() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const vol = this.config.BOOT_VOL;

        // 2. Hard Drive Spin Up (Mechanical Whine)
        const spinOsc = this.ctx.createOscillator();
        const spinGain = this.ctx.createGain();
        spinOsc.connect(spinGain);
        spinGain.connect(this.masterGain);

        spinOsc.type = 'sawtooth'; // Gritty motor sound
        spinOsc.frequency.setValueAtTime(30, t);
        spinOsc.frequency.exponentialRampToValueAtTime(300, t + this.config.BOOT_SPIN_DURATION * 0.8); 

        spinGain.gain.setValueAtTime(0, t);
        spinGain.gain.linearRampToValueAtTime(0.015 * vol, t + 0.5); // Fade in
        spinGain.gain.linearRampToValueAtTime(0, t + this.config.BOOT_SPIN_DURATION); // Fade out

        spinOsc.start(t);
        spinOsc.stop(t + this.config.BOOT_SPIN_DURATION);

        // 4. Transitions to Atmosphere
        setTimeout(() => {
            this.playAtmosphere();
        }, 1500);
    }

    async playDialUpSound() {
        if (!this.ctx) return;
        await this.resume();
        
        try {
            const response = await fetch('/sfx/dial-up.mp3');
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            
            const source = this.ctx.createBufferSource();
            source.buffer = audioBuffer;
            
            // Dedicated analyser for dial-up
            this.dialUpAnalyser = this.ctx.createAnalyser();
            this.dialUpAnalyser.fftSize = 256;
            
            const gain = this.ctx.createGain();
            gain.gain.value = this.config.BOOT_VOL;
            
            source.connect(this.dialUpAnalyser);
            this.dialUpAnalyser.connect(gain);
            gain.connect(this.masterGain);
            
            return new Promise((resolve) => {
                source.onended = () => {
                    this.dialUpAnalyser = null; // Clean up
                    resolve();
                };
                source.start(0);
            });
        } catch (e) {
            console.error("Failed to play dial-up sound:", e);
            // Fallback: resolve immediately so UI isn't stuck
            return Promise.resolve();
        }
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
        const bpm = 150;
        const beat = 60 / bpm;
        
        // --- INSTRUMENTS ---
        
        const kick = (time) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(0.8 * this.config.EASTER_EGG_VOL, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
            
            osc.start(time);
            osc.stop(time + 0.5);
        };
        
        const snare = (time) => {
            const noise = this.ctx.createOscillator(); 
            // WebAudio doesn't have noise oscillator by default, usually involves buffer
            // But for 8-bit style, we can use a high random periodic wave or create a buffer.
            // Let's create a quick noise buffer
            const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noiseSrc = this.ctx.createBufferSource();
            noiseSrc.buffer = buffer;
            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1000;
            const noiseGain = this.ctx.createGain();
            
            noiseSrc.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            
            noiseGain.gain.setValueAtTime(0.6 * this.config.EASTER_EGG_VOL, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            
            noiseSrc.start(time);
            noiseSrc.stop(time + 0.2);
        };
        
        const melody = (freq, time, len) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.1 * this.config.EASTER_EGG_VOL, time);
            gain.gain.linearRampToValueAtTime(0.1 * this.config.EASTER_EGG_VOL, time + len * 0.8);
            gain.gain.linearRampToValueAtTime(0, time + len); // Staccato release
            
            osc.start(time);
            osc.stop(time + len);
        };

        // --- SEQUENCE (Bar 1 & 2) ---
        // Simple "Amen-ish" break or 4-on-floor
        
        // Drums
        kick(t + 0 * beat);
        snare(t + 1 * beat);
        kick(t + 1.5 * beat); // Syncopated
        kick(t + 2 * beat);
        snare(t + 3 * beat);
        
        kick(t + 4 * beat);
        snare(t + 5 * beat);
        kick(t + 5.5 * beat); // Double kick
        kick(t + 6 * beat);
        // Crash/End
        
        // Melody (C Major Pentatonic Climb)
        const C5 = 523.25;
        const E5 = 659.25;
        const G5 = 783.99;
        const A5 = 880.00;
        const C6 = 1046.50;
        const E6 = 1318.51;
        const G6 = 1567.98;
        const C7 = 2093.00;
        
        // Fast 16th notes
        const noteLen = beat / 2; 
        
        melody(C5, t + 0 * beat, noteLen);
        melody(E5, t + 0.5 * beat, noteLen);
        melody(G5, t + 1 * beat, noteLen);
        melody(A5, t + 1.5 * beat, noteLen);
        
        melody(C6, t + 2 * beat, noteLen);
        melody(E6, t + 2.5 * beat, noteLen);
        melody(G6, t + 3 * beat, noteLen);
        melody(C7, t + 3.5 * beat, noteLen); // Peak
        
        // Resolving Chords (stab)
        const chord = (time) => {
             melody(C6, time, beat * 2);
             melody(E6, time, beat * 2);
             melody(G6, time, beat * 2);
        };
        
        chord(t + 4 * beat);
        
        // Final chime
         setTimeout(() => {
             // melody(C7, t + 7 * beat, beat * 2); // maybe too much?
         }, 3000);
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
        filter1.frequency.value = 2000;
        osc1.connect(filter1);
        filter1.connect(this.atmosphereGain);

        // Osc 2: High harmonic
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(700, this.ctx.currentTime); 
        osc2.connect(this.atmosphereGain);

        // Start
        osc1.start();
        osc2.start();

        this.atmosphereOscillators = [osc1, osc2];

        // Fade in smoothly - Lower volume
        this.atmosphereGain.gain.setTargetAtTime(0.04 * this.config.ATMOSPHERE_VOL, this.ctx.currentTime, 2);
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

    // --- Tracker Music System ---

    playTrackerMusic(url) {
        if (!this.ctx || this.isMuted) return;
        
        // Ensure ChiptuneJsPlayer is available
        if (typeof window.ChiptuneJsPlayer === 'undefined') {
            console.error("ChiptuneJsPlayer not found! Scripts might not be loaded.");
            return;
        }

        if (this.trackerPlayer) {
            this.trackerPlayer.stop();
            this.trackerPlayer = null;
        }

        // Initialize Player with our AudioContext
        // ChiptuneJsConfig(repeatCount, stereoSeparation, interpolationFilter, context, destination)
        // Tune to musicGain to respect MUSIC_VOL setting
        const config = new window.ChiptuneJsConfig(0, undefined, undefined, this.ctx, this.musicGain); 
        this.trackerPlayer = new window.ChiptuneJsPlayer(config);

        // Load and Play
        this.trackerPlayer.load(url, (buffer) => {
            if (!this.trackerPlayer) return; // Stopped while loading
            
            this.trackerPlayer.play(buffer); 
        });
    }

    stopTrackerMusic() {
        if (this.trackerPlayer) {
            this.trackerPlayer.stop();
            this.trackerPlayer = null;
            this.state.isMusicPlaying = false;
        }
    }

    toggleMusic() {
        if (this.state.isMusicPlaying) {
            this.stopTrackerMusic();
        } else {
            this.playTrackerMusic(this.playlist[this.state.currentSongIndex]);
            this.state.isMusicPlaying = true;
        }
    }

    nextSong() {
        this.state.currentSongIndex = (this.state.currentSongIndex + 1) % this.playlist.length;
        if (this.state.isMusicPlaying) {
            this.playTrackerMusic(this.playlist[this.state.currentSongIndex]);
        }
    }

    prevSong() {
        this.state.currentSongIndex = (this.state.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        if (this.state.isMusicPlaying) {
            this.playTrackerMusic(this.playlist[this.state.currentSongIndex]);
        }
    }

    // --- VISUALIZATION ONLY (Offline Access) ---
    async loadVisualizer(url) {
        if (!window.libopenmpt) return;
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const lib = window.libopenmpt;
            
            // Copy to Emscripten Heap
            const byteArray = new Int8Array(arrayBuffer);
            const ptr = lib._malloc(byteArray.byteLength);
            lib.HEAP8.set(byteArray, ptr);
            
            // Create Module
            this.visualMod = lib._openmpt_module_create_from_memory(ptr, byteArray.byteLength, 0, 0, 0);
            lib._free(ptr);
            
            if (this.visualMod) {
                console.log("Visualizer Module Loaded:", url);
            }
        } catch (e) {
            console.error("Failed to load visualizer:", e);
        }
    }

    // Helper to read from ANY module pointer (player or visualizer)
    _readRowData(mod, p, r) {
        if (!mod || !window.libopenmpt) return ["...", "...", "...", "..."];
        const lib = window.libopenmpt;
        const numChannels = lib._openmpt_module_get_num_channels(mod);
        const channels = [];
        
        const hasFormatter = !!lib._openmpt_module_format_pattern_row_channel;
        const hasRaw = !!lib._openmpt_module_get_pattern_row_channel_command;

        for (let i = 0; i < numChannels; i++) {
             let chStr = "...";
             if (hasFormatter) {
                const strPtr = lib._openmpt_module_format_pattern_row_channel(mod, p, r, i, 0, 0); 
                if (strPtr) {
                    // Manual UTF8ToString since lib.UTF8ToString is missing
                    let str = "";
                    let ptr = strPtr;
                    if (lib.UTF8ToString) {
                        str = lib.UTF8ToString(strPtr);
                    } else {
                        // Read until null terminator
                        const bytes = [];
                        while (true) {
                            const byte = lib.HEAPU8[ptr];
                            if (byte === 0) break;
                            bytes.push(byte);
                            ptr++;
                        }
                        str = new TextDecoder().decode(new Uint8Array(bytes));
                    }
                    
                    chStr = str;
                    lib._openmpt_free_string(strPtr); 
                }
             } else if (hasRaw) {
                 const note = lib._openmpt_module_get_pattern_row_channel_command(mod, p, r, i, 0);
                 if (note > 0 && note <= 120) chStr = `N:${note}`;
                 else if (note === 254 || note === 255) chStr = "===";
             }
             if (!chStr || chStr.trim() === "") chStr = "...";
             channels.push(chStr);
        }
        return channels;
    }

    getVisualizerData(simulatedRowIndex) {
         if (!this.visualMod) return null;
         const lib = window.libopenmpt;
         
         // 1. Determine Order and Row from the linear index
         // We assume a standard "Speed" of 1 row per unit for simplicity in this offline view.
         // Real tracking is complex, but this is enough for visuals.
         
         const numOrders = lib._openmpt_module_get_num_orders(this.visualMod);
         if (numOrders === 0) return null;

         // Wrap global index to song length (approx limit 500 orders * 64 rows?)
         // Let's just wrap orders.
         
         // We'll perform a "safe" lookup:
         // Iterate orders to find where this row falls? 
         // Too expensive. Let's assume average 64 rows/pattern for the Seek, 
         // but use actual lengths for the Read.
         
         const estimatedRowsPerPattern = 64;
         const orderIndex = Math.floor(simulatedRowIndex / estimatedRowsPerPattern) % numOrders;
         let row = simulatedRowIndex % estimatedRowsPerPattern;
         
         // 2. Get Actual Pattern from Order
         const pattern = lib._openmpt_module_get_order_pattern(this.visualMod, orderIndex);
         
         // 3. Validate Row against Actual Pattern Length
         const numRows = lib._openmpt_module_get_pattern_num_rows(this.visualMod, pattern);
         
         // If row is out of bounds for this specific pattern, we effectively "skip" or show silence
         // simulating that this pattern ended early.
         if (row >= numRows) {
              return { pattern, row, channels: ["...", "...", "...", "..."], numRows };
         }
         
         // 4. Fetch Data
         const channels = this._readRowData(this.visualMod, pattern, row);
         return { pattern, row, channels, numRows };
    }

    // Returns just position { pattern, row, numRowsInPattern }
    getTrackerPosition() {
        if (!this.trackerPlayer || !this.trackerPlayer.currentPlayingNode || !window.libopenmpt) return null;
        const mod = this.trackerPlayer.currentPlayingNode.modulePtr;
        if (!mod) return null;
        const lib = window.libopenmpt;

        const pattern = lib._openmpt_module_get_current_pattern(mod);
        const row = lib._openmpt_module_get_current_row(mod);
        const numChannels = lib._openmpt_module_get_num_channels(mod);
        const numRows = lib._openmpt_module_get_pattern_num_rows(mod, pattern);

        return { pattern, row, numChannels, numRows };
    }

    // Returns data for a specific pattern/row
    getPatternRowData(p, r) {
        // Prefer Active Player
        if (this.trackerPlayer && this.trackerPlayer.currentPlayingNode) {
             const mod = this.trackerPlayer.currentPlayingNode.modulePtr;
             if (mod) return this._readRowData(mod, p, r);
        }
        // Fallback to Visualizer (if same context? No, pattern/row request implies context)
        // If we are asking freely, we can use visualMod.
        if (this.visualMod) {
            return this._readRowData(this.visualMod, p, r);
        }
        return null;
    }

    // API-Compatible wrapper for VFD/Legacy
    getTrackerData() {
        const pos = this.getTrackerPosition();
        if (!pos) return null;
        const channels = this.getPatternRowData(pos.pattern, pos.row);
        return {
            row: pos.row,
            pattern: pos.pattern,
            channels
        };
    }
}


export default new SoundManager();
