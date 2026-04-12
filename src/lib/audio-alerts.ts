class AudioPlayer {
    private static ctx: AudioContext | null = null;
    private static isInitialized = false;

    public static init() {
        if (!this.isInitialized && typeof window !== 'undefined') {
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    this.ctx = new AudioContextClass();
                }
                this.isInitialized = true;
            } catch (e) {
                console.warn('Web Audio API not supported', e);
            }
        }
    }

    // A pleasant "ding" for a successful sale
    public static playSaleSound() {
        this.init();
        if (!this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, t); // A5
            osc.frequency.exponentialRampToValueAtTime(1760, t + 0.1); // Jump to A6

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.5);
        } catch (e) {
            console.error('Error playing sale sound', e);
        }
    }

    // A subtle "pop" or "blip" for stock alerts or updates
    public static playStockAlertSound() {
        this.init();
        if (!this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            // Start lower and jump higher for an 'alert' feel
            osc.frequency.setValueAtTime(440, t); // A4
            osc.frequency.exponentialRampToValueAtTime(660, t + 0.1); // E5

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.3);
        } catch (e) {
            console.error('Error playing stock sound', e);
        }
    }
}

export const playSaleSound = () => AudioPlayer.playSaleSound();
export const playStockAlertSound = () => AudioPlayer.playStockAlertSound();
