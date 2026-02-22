import { CONFIG } from '../data/config.js';
import { clamp, degToRad, screenToCanvas } from '../utils/math.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.baseX = CONFIG.DESIGN_WIDTH / 2;
        this.baseY = CONFIG.DESIGN_HEIGHT - 40;

        this.aimAngle = 0; // radians, 0 = straight up
        this.isAiming = false;
        this.wantsFire = false;
        this.activePointerId = null;
        this.keyboardAimActive = false;

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);

        canvas.addEventListener('pointerdown', this._onPointerDown);
        canvas.addEventListener('pointermove', this._onPointerMove);
        canvas.addEventListener('pointerup', this._onPointerUp);
        canvas.addEventListener('pointercancel', this._onPointerUp);

        // Keyboard support
        this._keysHeld = new Set();
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    _updateIsAiming() {
        this.isAiming = this.activePointerId !== null || this.keyboardAimActive;
    }

    _onKeyDown(e) {
        if (e.repeat) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            this._keysHeld.add(e.key);
            this.keyboardAimActive = true;
            this._updateIsAiming();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.wantsFire = true;
        }
    }

    _onKeyUp(e) {
        this._keysHeld.delete(e.key);
        this._updateIsAiming();
    }

    update(dt) {
        const aimSpeed = 1.5;
        if (this._keysHeld.has('ArrowLeft')) {
            this.aimAngle -= aimSpeed * dt;
        }
        if (this._keysHeld.has('ArrowRight')) {
            this.aimAngle += aimSpeed * dt;
        }
        if (this._keysHeld.size > 0) {
            const minRad = degToRad(CONFIG.AIM_ANGLE_MIN);
            const maxRad = degToRad(CONFIG.AIM_ANGLE_MAX);
            this.aimAngle = clamp(this.aimAngle, minRad, maxRad);
        }
    }

    _screenToCanvas(e) {
        return screenToCanvas(this.canvas, e);
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
        this.keyboardAimActive = false;
        this.activePointerId = e.pointerId;
        this.canvas.setPointerCapture(e.pointerId);
        const pos = this._screenToCanvas(e);
        this._updateAngle(pos);
        this._updateIsAiming();
    }

    _onPointerMove(e) {
        if (e.pointerId !== this.activePointerId) return;
        this.keyboardAimActive = false;
        const pos = this._screenToCanvas(e);
        this._updateAngle(pos);
    }

    _onPointerUp(e) {
        if (e.pointerId !== this.activePointerId) return;
        this.activePointerId = null;
        this.keyboardAimActive = false;
        this._updateIsAiming();
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
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
    }
}
