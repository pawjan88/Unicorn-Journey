const COLORS = ['#f5456f','#ff941f','#ffd32c','#1cbd92','#258cdb','#984ce6','#fce9a0'];
export class Celebration {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.age = -1;
    this.resize();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width); this.height = Math.max(1, rect.height);
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * ratio); this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  start() {
    this.reset(); this.age = 0;
    for (const side of [-1, 1]) for (let i = 0; i < 170; i++) {
      this.particles.push({
        x: side < 0 ? this.width * .06 : this.width * .94,
        y: this.height * .86,
        vx: -side * this.width * (.14 + Math.random() * .42),
        vy: -this.height * (.65 + Math.random() * 1.0),
        rotation: Math.random() * 6.28,
        spin: (Math.random() - .5) * 9,
        size: 3 + Math.random() * 7,
        color: COLORS[i % COLORS.length], glitter: i % 3 === 0,
        phase: Math.random() * 6.28, life: 5 + Math.random() * 2,
      });
    }
  }
  reset() {
    this.particles.length = 0; this.age = -1;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  update(dt) {
    if (this.age < 0) return;
    this.age += dt;
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);
    for (const p of this.particles) {
      p.life -= dt;
      p.vx *= Math.exp(-.35 * dt);
      p.vy += this.height * .48 * dt;
      p.x += (p.vx + Math.sin(this.age * 3 + p.phase) * 14) * dt;
      p.y += p.vy * dt; p.rotation += p.spin * dt;
      if (p.life <= 0) continue;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rotation);
      c.globalAlpha = Math.min(1, p.life) * (p.glitter ? .65 + Math.sin(this.age * 5 + p.phase) * .3 : .95);
      c.fillStyle = p.glitter ? '#fff0a3' : p.color;
      if (p.glitter) {
        c.shadowBlur = 9; c.shadowColor = '#ffd337';
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4, radius = i % 2 ? p.size * .24 : p.size;
          const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
          if (i === 0) c.moveTo(x,y); else c.lineTo(x,y);
        }
        c.closePath(); c.fill();
      } else {
        c.scale(Math.max(.18, Math.abs(Math.cos(this.age * 5 + p.phase))),1);
        c.fillRect(-p.size/2, -p.size/3, p.size, p.size*.65);
      }
      c.restore();
    }
    this.particles = this.particles.filter(p => p.life > 0 && p.y < this.height + 80);
    if (!this.particles.length || this.age > 8) this.reset();
  }
}
