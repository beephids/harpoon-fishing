import { CONFIG } from '../data/config.js';
import { clamp, degToRad } from '../utils/math.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.baseX = CONFIG.DESIGN_WIDTH / 2;
        this.baseY = CONFIG.DESIGN_HEIGHT - 40;

        this.aimAngle = 0; // radians, 0 = straight up
        this.isAiming = false;
        this.wantsFire = false;
        this.activePointerId = null;

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);

        canvas.addEventListener('pointerdown', this._onPointerDown);
        canvas.addEventListener('pointermove', this._onPointerMove);
        canvas.addEventListener('pointerup', this._onPointerUp);
        canvas.addEventListener('pointercancel', this._onPointerUp);
    }

    _screenToCanvas(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    _updateAngle(pos) {
        const dx = pos.x - this.baseX;
        const dy = this.baseY - pos.y; // invert Y (up is positive)

        if (dy <= 0) {
            // Pointer is below or at the harpoon base; keep previous angle
            return;
        }

        this.aimAngle = Math.atan2(dx, dy);
        const minRad = degToRad(CONFIG.AIM_ANGLE_MIN);
        const maxRad = degToRad(CONFIG.AIM_ANGLE_MAX);
        this.aimAngle = clamp(this.aimAngle, minRad, maxRad);
    }

    _onPointerDown(e) {
        if (this.activePointerId !== null) return;
        this.activePointerId = e.pointerId;
        this.canvas.setPointerCapture(e.pointerId);
        const pos = this._screenToCanvas(e);
        this._updateAngle(pos);
        this.isAiming = true;
    }

    _onPointerMove(e) {
        if (e.pointerId !== this.activePointerId) return;
        const pos = this._screenToCanvas(e);
        this._updateAngle(pos);
    }

    _onPointerUp(e) {
        if (e.pointerId !== this.activePointerId) return;
        this.activePointerId = null;
        this.isAiming = false;
        this.wantsFire = true;
    }

    consumeFire() {
        if (this.wantsFire) {
            this.wantsFire = false;
            return true;
        }
        return false;
    }

    destroy() {
        this.canvas.removeEventListener('pointerdown', this._onPointerDown);
        this.canvas.removeEventListener('pointermove', this._onPointerMove);
        this.canvas.removeEventListener('pointerup', this._onPointerUp);
        this.canvas.removeEventListener('pointercancel', this._onPointerUp);
    }
}
