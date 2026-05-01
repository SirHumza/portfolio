const year = new Date().getFullYear();
document.title = `SirHumza • ${year}`;

const root = document.documentElement;
let raf = 0;
let x = window.innerWidth / 2;
let y = window.innerHeight / 2;
let tx = x;
let ty = y;
let active = matchMedia('(hover: hover) and (pointer: fine)').matches;

window.addEventListener('pointermove', (event) => {
  if (!active) return;
  tx = event.clientX;
  ty = event.clientY;
  if (!raf) {
    raf = requestAnimationFrame(tick);
  }
});

window.addEventListener('pointerleave', () => {
  active = false;
});

window.addEventListener('pointerenter', () => {
  active = matchMedia('(hover: hover) and (pointer: fine)').matches;
});

function tick() {
  x += (tx - x) * 0.12;
  y += (ty - y) * 0.12;
  root.style.setProperty('--mx', `${x}px`);
  root.style.setProperty('--my', `${y}px`);
  if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) {
    raf = requestAnimationFrame(tick);
    return;
  }
  raf = 0;
}
