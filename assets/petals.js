/**
 * petals.js - Procedural 3D Tumbling Rose Petal & Embers Engine
 */
class RosePetalSystem {
  constructor(width, height, count = 35) {
    this.width = width;
    this.height = height;
    this.count = count;
    this.petals = [];
    this.embers = [];

    for (let i = 0; i < count; i++) {
      this.petals.push(this.createPetal(true));
    }

    for (let i = 0; i < 45; i++) {
      this.embers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 3,
        alpha: 0.2 + Math.random() * 0.6,
        pulseSpeed: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 15,
        vy: -20 - Math.random() * 30,
        color: Math.random() > 0.5 ? '#ff2a85' : '#ff99cc'
      });
    }
  }

  createPetal(randomY = false) {
    const size = 22 + Math.random() * 26;
    return {
      x: Math.random() * (this.width + 200) - 100,
      y: randomY ? Math.random() * (this.height + 200) - 100 : -60 - Math.random() * 80,
      size: size,
      aspect: 0.75 + Math.random() * 0.4,
      curl: 0.15 + Math.random() * 0.35,
      vx: -15 + Math.random() * 30,
      vy: 45 + Math.random() * 65,
      // 3D angles
      yaw: Math.random() * Math.PI * 2,
      pitch: Math.random() * Math.PI * 2,
      roll: Math.random() * Math.PI * 2,
      dYaw: (Math.random() - 0.5) * 2.2,
      dPitch: (Math.random() - 0.5) * 3.0,
      dRoll: (Math.random() - 0.5) * 1.8,
      wobblePhase: Math.random() * Math.PI * 2,
      opacity: 0.65 + Math.random() * 0.35,
      colorVariant: Math.random() // 0 to 1 for subtle shade differences
    };
  }

  update(dt, wind = 10) {
    for (let p of this.petals) {
      p.yaw += p.dYaw * dt;
      p.pitch += p.dPitch * dt;
      p.roll += p.dRoll * dt;
      p.wobblePhase += dt * 2.5;

      const sway = Math.sin(p.wobblePhase) * 25;
      p.x += (p.vx + wind + sway) * dt;
      p.y += p.vy * dt;

      if (p.y > this.height + 80 || p.x < -150 || p.x > this.width + 150) {
        Object.assign(p, this.createPetal(false));
      }
    }

    for (let e of this.embers) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.phase += e.pulseSpeed * dt;
      if (e.y < -30) {
        e.y = this.height + 20;
        e.x = Math.random() * this.width;
      }
    }
  }

  render(ctx, time) {
    // 1. Render Embers / Sparkles
    for (let e of this.embers) {
      const a = e.alpha * (0.6 + 0.4 * Math.sin(e.phase));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Render 3D Tumbling Rose Petals
    for (let p of this.petals) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.roll);

      // 3D perspective squish via pitch & yaw
      const scaleX = Math.cos(p.yaw);
      const scaleY = Math.cos(p.pitch);
      ctx.scale(Math.max(0.08, Math.abs(scaleX)), Math.max(0.12, Math.abs(scaleY)));

      ctx.globalAlpha = p.opacity;

      // Base Rose petal gradient
      const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
      if (p.colorVariant > 0.5) {
        grad.addColorStop(0, '#e61e68');   // Top vibrant rose
        grad.addColorStop(0.5, '#990d3d'); // Mid body
        grad.addColorStop(1, '#4a051c');   // Dark base
      } else {
        grad.addColorStop(0, '#ff3377');   // Lighter pink
        grad.addColorStop(0.6, '#aa1149'); // Mid wine
        grad.addColorStop(1, '#380214');   // Deep plum
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      const w = p.size * p.aspect;
      const h = p.size;

      // Organic curved petal outline
      ctx.moveTo(0, h * 0.9);
      ctx.bezierCurveTo(-w * 0.9, h * 0.4, -w * 1.1, -h * 0.4, -w * 0.3, -h);
      ctx.bezierCurveTo(0, -h * 1.15, w * 0.3, -h * 1.15, w * 0.3, -h);
      ctx.bezierCurveTo(w * 1.1, -h * 0.4, w * 0.9, h * 0.4, 0, h * 0.9);
      ctx.closePath();
      ctx.fill();

      // Specular rim curl highlight
      ctx.strokeStyle = 'rgba(255, 180, 210, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }
}

if (typeof window !== 'undefined') {
  window.RosePetalSystem = RosePetalSystem;
}

