import { CONFIG } from './data/config.js';
import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

function resize() {
    const aspectRatio = CONFIG.DESIGN_WIDTH / CONFIG.DESIGN_HEIGHT;
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
}

window.addEventListener('resize', resize);
resize();

game.start();
