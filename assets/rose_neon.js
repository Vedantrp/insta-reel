/**
 * rose_neon.js - Procedural & Vector Neon Glowing Rose Drawing Engine
 */
function drawNeonRose(ctx, cx, cy, scale = 1.0, progress = 1.0, pulse = 0.0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const neonPink = '#ff2a85';
  const neonLight = '#ffa6d2';
  const neonCore = '#ffffff';

  // Glow intensity with audio pulse
  const glowBlur = 18 + pulse * 14;
  const outerAlpha = 0.55 + pulse * 0.35;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function drawRosePaths() {
    ctx.beginPath();

    // 1. Stem
    ctx.moveTo(0, 40);
    ctx.bezierCurveTo(-15, 120, 20, 220, -5, 340);

    // 2. Leaves
    // Right leaf
    ctx.moveTo(8, 160);
    ctx.bezierCurveTo(65, 130, 95, 175, 80, 205);
    ctx.bezierCurveTo(45, 215, 15, 185, 8, 180);
    // Left leaf
    ctx.moveTo(-6, 230);
    ctx.bezierCurveTo(-65, 200, -95, 245, -80, 275);
    ctx.bezierCurveTo(-45, 285, -15, 255, -6, 250);

    // 3. Rose Calyx & Base
    ctx.moveTo(-35, 40);
    ctx.bezierCurveTo(-20, 65, 20, 65, 35, 40);

    // 4. Outer Petals
    // Left outer petal
    ctx.moveTo(-15, 40);
    ctx.bezierCurveTo(-75, 20, -90, -50, -55, -90);
    ctx.bezierCurveTo(-25, -115, 10, -90, 0, -60);

    // Right outer petal
    ctx.moveTo(15, 40);
    ctx.bezierCurveTo(75, 20, 90, -50, 55, -90);
    ctx.bezierCurveTo(25, -115, -10, -90, 0, -60);

    // Bottom wrap petal
    ctx.moveTo(-50, -40);
    ctx.bezierCurveTo(-60, 20, 60, 20, 50, -40);

    // 5. Middle Swirl Petals
    ctx.moveTo(-40, -75);
    ctx.bezierCurveTo(-65, -130, 0, -170, 35, -125);
    ctx.bezierCurveTo(60, -90, 20, -45, -15, -60);

    // Opposite swirl
    ctx.moveTo(35, -75);
    ctx.bezierCurveTo(55, -130, -10, -165, -30, -125);

    // Center spiral / bud
    ctx.moveTo(-18, -105);
    ctx.bezierCurveTo(-25, -140, 25, -145, 18, -110);
    ctx.bezierCurveTo(12, -85, -10, -90, -5, -115);
  }

  // Pass 1: Diffuse Atmospheric Outer Bloom
  ctx.save();
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = glowBlur * 2.2;
  ctx.strokeStyle = `rgba(255, 0, 85, ${outerAlpha * 0.4})`;
  ctx.lineWidth = 14;
  drawRosePaths();
  ctx.stroke();
  ctx.restore();

  // Pass 2: Vibrant Mid-Glow Neon
  ctx.save();
  ctx.shadowColor = neonPink;
  ctx.shadowBlur = glowBlur;
  ctx.strokeStyle = neonPink;
  ctx.lineWidth = 6;
  drawRosePaths();
  ctx.stroke();
  ctx.restore();

  // Pass 3: White Hot Core Wire
  ctx.save();
  ctx.shadowColor = neonLight;
  ctx.shadowBlur = 4;
  ctx.strokeStyle = neonCore;
  ctx.lineWidth = 2.5;
  drawRosePaths();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

if (typeof window !== 'undefined') {
  window.drawNeonRose = drawNeonRose;
}

