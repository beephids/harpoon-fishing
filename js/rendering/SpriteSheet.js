export class SpriteSheet {
    constructor(src) {
        this.image = new Image();
        this.loaded = false;
        this._promise = new Promise((resolve, reject) => {
            this.image.onload = () => {
                this.loaded = true;
                resolve(this);
            };
            this.image.onerror = () => reject(new Error(`Failed to load: ${src}`));
        });
        this.image.src = src;
    }

    ready() {
        return this._promise;
    }

    drawFrame(ctx, sx, sy, sw, sh, dx, dy, dw, dh) {
        if (!this.loaded) return;
        ctx.drawImage(this.image, sx, sy, sw, sh, dx, dy, dw, dh);
    }
}
