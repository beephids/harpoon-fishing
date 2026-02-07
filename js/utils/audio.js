export class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not available');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Simple noise buffer for splash-like sounds
    _createNoise(duration) {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playSplash() {
        if (!this.initialized) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Filtered noise burst
        const noise = ctx.createBufferSource();
        noise.buffer = this._createNoise(0.3);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        noise.connect(filter).connect(gain).connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.3);
    }

    playHit() {
        if (!this.initialized) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Short thud with harmonic
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        // Click transient
        const click = ctx.createOscillator();
        click.type = 'square';
        click.frequency.setValueAtTime(1000, now);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.2, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        click.connect(clickGain).connect(ctx.destination);
        click.start(now);
        click.stop(now + 0.03);
    }

    playMiss() {
        if (!this.initialized) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Soft water plop
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playChestOpen() {
        if (!this.initialized) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Creaky hinge rising tone
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);

        // Sparkle
        for (let i = 0; i < 3; i++) {
            const sparkle = ctx.createOscillator();
            sparkle.type = 'sine';
            const t = now + 0.2 + i * 0.1;
            sparkle.frequency.setValueAtTime(800 + i * 200, t);

            const sGain = ctx.createGain();
            sGain.gain.setValueAtTime(0.08, t);
            sGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

            sparkle.connect(sGain).connect(ctx.destination);
            sparkle.start(t);
            sparkle.stop(t + 0.15);
        }
    }

    playBonusHarpoon() {
        if (!this.initialized) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Cheerful ascending chime
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            const t = now + i * 0.1;
            osc.frequency.setValueAtTime(freq, t);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

            osc.connect(gain).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.25);
        });
    }

    playLegendary() {
        if (!this.initialized) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Triumphant fanfare
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            const t = now + i * 0.12;
            osc.frequency.setValueAtTime(freq, t);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

            osc.connect(gain).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.4);
        });

        // Shimmer
        const shimmer = ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(2000, now + 0.4);
        shimmer.frequency.exponentialRampToValueAtTime(1500, now + 1.0);

        const sGain = ctx.createGain();
        sGain.gain.setValueAtTime(0.06, now + 0.4);
        sGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

        shimmer.connect(sGain).connect(ctx.destination);
        shimmer.start(now + 0.4);
        shimmer.stop(now + 1.0);
    }

    playGameOver() {
        if (!this.initialized) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Descending tone
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.6);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
    }
}

// Singleton
export const audio = new AudioManager();
