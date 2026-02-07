export class Animator {
    constructor(frames, fps = 4) {
        this.frames = frames;
        this.fps = fps;
        this.timer = 0;
        this.frameIndex = 0;
    }

    update(dt) {
        this.timer += dt;
        const interval = 1 / this.fps;
        if (this.timer >= interval) {
            this.timer -= interval;
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
        }
    }

    getCurrentFrame() {
        return this.frames[this.frameIndex];
    }

    reset() {
        this.timer = 0;
        this.frameIndex = 0;
    }
}
