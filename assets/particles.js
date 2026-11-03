/**
 * particles.js - Multi-Atmosphere Procedural Particle System
 * Supports: 'fireflies', 'stardust', 'embers', and 'petals'
 */
class AtmosphericParticleSystem {
  constructor(width, height, type = 'fireflies', count = 45, accentColor = '#ff2a85') {
    this.width = width;
    this.height = height;
    this.type = type;
    this.count = count;
    this.accentColor = accentColor;
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(initial = false) {
    const y = initial ? Math.random() * this.height : (this.type === 'embers' ? this.height + 20 : -20);
    const x = Math.random() * this.width;

    if (this.type === 'petals') {
      return {
        type: 'petal',
        x, y,
        z: 0.5 + Math.random() * 1.5,
        size: 18 + Math.random() * 22,
        aspect: 0.65 + Math.random() * 0.45,
        pitch: Math.random() * Math.PI * 2,
        yaw: Math.random() * Math.PI * 2,
        roll: Math.random() * Math.PI * 2,
        pitchSpeed: (Math.random() - 0.5) * 3,
        yawSpeed: (Math.random() - 0.5) * 2.5,
        rollSpeed: (Math.random() - 0.5) * 1.8,
        vx: (Math.random() - 0.5) * 45,
        vy: 80 + Math.random() * 95,
        colorVariant: Math.random(),
        opacity: 0.65 + Math.random() * 0.35
      };
    } else if (this.type === 'embers') {
      return {
        type: 'ember',
        x, y,
        r: 1.5 + Math.random() * 3.5,
        vx: (Math.random() - 0.5) * 35,
        vy: -(60 + Math.random() * 90),
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 1.5 + Math.random() * 2.5,
        color: Math.random() > 0.4 ? '#ffaa44' : '#ff4422',
        opacity: 0.3 + Math.random() * 0.7
      };
    } else if (this.type === 'stardust') {
      return {
        type: 'stardust',
        x, y,
        r: 1 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 15,
        vy: 20 + Math.random() * 40,
        phase: Math.random() * Math.PI * 2,
        sparkleSpeed: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#ffffff' : this.accentColor,
        opacity: 0.4 + Math.random() * 0.6
      };
    } else {
      // Default: 'fireflies'
      return {
        type: 'firefly',
        x, y,
        r: 2.0 + Math.random() * 4.0,
        vx: (Math.random() - 0.5) * 25,
        vy: (Math.random() - 0.5) * 25,
        wanderPhase: Math.random() * Math.PI * 2,
        glowPhase: Math.random() * Math.PI * 2,
        glowSpeed: 1.2 + Math.random() * 2.0,
        color: Math.random() > 0.5 ? '#ffe066' : '#ffb3d9',
        opacity: 0.3 + Math.random() * 0.65
      };
    }
  }

  update(dt = 1 / 24, windStrength = 0) {
    for (let p of this.particles) {
      if (p.type === 'petal') {
        p.pitch += p.pitchSpeed * dt;
        p.yaw += p.yawSpeed * dt;
        p.roll += p.rollSpeed * dt;
        p.x += (p.vx + windStrength) * dt * p.z;
        p.y += p.vy * dt * p.z;
        if (p.y > this.height + 40 || p.x < -60 || p.x > this.width + 60) {
          Object.assign(p, this.createParticle(false));
        }
      } else if (p.type === 'ember') {
        p.phase += p.pulseSpeed * dt;
        p.x += (p.vx + Math.sin(p.phase) * 18 + windStrength) * dt;
        p.y += p.vy * dt;
        if (p.y < -20 || p.x < -20 || p.x > this.width + 20) {
          Object.assign(p, this.createParticle(false));
        }
      } else if (p.type === 'stardust') {
        p.phase += p.sparkleSpeed * dt;
        p.x += (p.vx + windStrength) * dt;
        p.y += p.vy * dt;
        if (p.y > this.height + 20) {
          Object.assign(p, this.createParticle(false));
        }
      } else {
        // firefly
        p.wanderPhase += dt * 1.5;
        p.glowPhase += p.glowSpeed * dt;
        p.x += (Math.cos(p.wanderPhase) * 20 + windStrength) * dt;
        p.y += (Math.sin(p.wanderPhase * 1.3) * 15 - 5) * dt;
        if (p.y < -30) p.y = this.height + 20;
        if (p.y > this.height + 30) p.y = -20;
        if (p.x < -30) p.x = this.width + 20;
        if (p.x > this.width + 30) p.x = -20;
      }
    }
  }

  render(ctx, time) {
    for (let p of this.particles) {
      if (p.type === 'petal') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.roll);
        const scaleX = Math.cos(p.yaw);
        const scaleY = Math.cos(p.pitch);
        ctx.scale(Math.max(0.08, Math.abs(scaleX)), Math.max(0.12, Math.abs(scaleY)));
        ctx.globalAlpha = p.opacity;

        const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
        if (p.colorVariant > 0.5) {
          grad.addColorStop(0, '#e61e68');
          grad.addColorStop(0.5, '#990d3d');
          grad.addColorStop(1, '#4a051c');
        } else {
          grad.addColorStop(0, '#ff3377');
          grad.addColorStop(0.6, '#aa1149');
          grad.addColorStop(1, '#380214');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        const w = p.size * p.aspect;
        const h = p.size;
        ctx.moveTo(0, h * 0.9);
        ctx.bezierCurveTo(-w * 0.9, h * 0.4, -w * 1.1, -h * 0.4, -w * 0.3, -h);
        ctx.bezierCurveTo(0, -h * 1.15, w * 0.3, -h * 1.15, w * 0.3, -h);
        ctx.bezierCurveTo(w * 1.1, -h * 0.4, w * 0.9, h * 0.4, 0, h * 0.9);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 180, 210, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'firefly' || p.type === 'ember' || p.type === 'stardust') {
        const pulse = 0.5 + 0.5 * Math.sin(p.phase || p.glowPhase || 0);
        const a = p.opacity * (0.4 + 0.6 * pulse);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.r * 5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Hot center core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.AtmosphericParticleSystem = AtmosphericParticleSystem;
}

