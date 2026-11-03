/**
 * vector_motifs.js
 * Procedural Glowing Vector Neon Motifs for Aesthetic Lyric Reels.
 * Renders crisp, multi-pass bloom vector symbols matching song themes.
 */

function drawNeonSymbol(symbolName, ctx, cx, cy, scale = 1.0, pulse = 0.0, accentColor = '#ff2a85', lightColor = '#ffa6d2') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const glowBlur = 18 + pulse * 14;
  const outerAlpha = 0.55 + pulse * 0.35;

  function renderGlow(pathFn, strokeW = 4.0) {
    // 1. Wide ambient bloom
    ctx.save();
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = glowBlur * 2.2;
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = outerAlpha * 0.7;
    ctx.lineWidth = strokeW + 4;
    pathFn();
    ctx.stroke();
    ctx.restore();

    // 2. Focused vibrant glow
    ctx.save();
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = glowBlur;
    ctx.strokeStyle = lightColor;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = strokeW;
    pathFn();
    ctx.stroke();
    ctx.restore();

    // 3. Specular white-hot core
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = Math.max(1.5, strokeW * 0.45);
    pathFn();
    ctx.stroke();
    ctx.restore();
  }

  switch (symbolName) {
    case 'butterfly':
      // Elegant romantic butterfly with gentle wing flutter
      const wingFlutter = 1.0 + Math.sin(pulse * Math.PI * 2) * 0.12;
      renderGlow(() => {
        ctx.beginPath();
        // Body
        ctx.moveTo(0, -60);
        ctx.lineTo(0, 70);
        // Antennae
        ctx.moveTo(0, -55);
        ctx.bezierCurveTo(-15, -85, -35, -95, -45, -80);
        ctx.moveTo(0, -55);
        ctx.bezierCurveTo(15, -85, 35, -95, 45, -80);
        // Left top wing
        ctx.moveTo(0, -35);
        ctx.bezierCurveTo(-50 * wingFlutter, -110, -135 * wingFlutter, -70, -110 * wingFlutter, 10);
        ctx.bezierCurveTo(-90 * wingFlutter, 45, -30 * wingFlutter, 15, 0, 5);
        // Right top wing
        ctx.moveTo(0, -35);
        ctx.bezierCurveTo(50 * wingFlutter, -110, 135 * wingFlutter, -70, 110 * wingFlutter, 10);
        ctx.bezierCurveTo(90 * wingFlutter, 45, 30 * wingFlutter, 15, 0, 5);
        // Left lower wing
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(-85 * wingFlutter, 35, -80 * wingFlutter, 95, -35 * wingFlutter, 105);
        ctx.bezierCurveTo(-15 * wingFlutter, 110, -5 * wingFlutter, 65, 0, 50);
        // Right lower wing
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(85 * wingFlutter, 35, 80 * wingFlutter, 95, 35 * wingFlutter, 105);
        ctx.bezierCurveTo(15 * wingFlutter, 110, 5 * wingFlutter, 65, 0, 50);
      });
      break;

    case 'crescent_moon':
      // Dreamy crescent moon with dangling star
      renderGlow(() => {
        ctx.beginPath();
        // Crescent
        ctx.arc(0, 0, 90, 0.4 * Math.PI, 1.7 * Math.PI, false);
        ctx.bezierCurveTo(-45, -50, -45, 50, 28, 85);
        // Dangling star chain
        ctx.moveTo(25, -60);
        ctx.lineTo(35, -10);
      });
      // Dangling 4-point star
      renderGlow(() => {
        ctx.beginPath();
        const sx = 35, sy = 5;
        const sr = 18 + pulse * 6;
        ctx.moveTo(sx, sy - sr);
        ctx.quadraticCurveTo(sx, sy, sx + sr, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy + sr);
        ctx.quadraticCurveTo(sx, sy, sx - sr, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy - sr);
      }, 3.0);
      break;

    case 'infinity_heart':
      // Intertwined eternal love infinity heart
      renderGlow(() => {
        ctx.beginPath();
        // Top heart lobes looping into infinite bottom loops
        ctx.moveTo(0, 45);
        ctx.bezierCurveTo(-80, -35, -110, -85, -55, -115);
        ctx.bezierCurveTo(-20, -130, 0, -85, 0, -65);
        ctx.bezierCurveTo(0, -85, 20, -130, 55, -115);
        ctx.bezierCurveTo(110, -85, 80, -35, 0, 45);
        // Infinity loop at bottom
        ctx.bezierCurveTo(-45, 95, -95, 85, -85, 125);
        ctx.bezierCurveTo(-75, 155, -25, 145, 0, 105);
        ctx.bezierCurveTo(25, 145, 75, 155, 85, 125);
        ctx.bezierCurveTo(95, 85, 45, 95, 0, 45);
      });
      break;

    case 'flame':
      // Stylized high-energy club flame
      renderGlow(() => {
        ctx.beginPath();
        ctx.moveTo(0, -120);
        ctx.bezierCurveTo(-40, -60, -95, 0, -75, 75);
        ctx.bezierCurveTo(-60, 125, 60, 125, 75, 75);
        ctx.bezierCurveTo(95, 0, 40, -60, 0, -120);
        // Inner flame curl
        ctx.moveTo(-15, 65);
        ctx.bezierCurveTo(-35, 15, -15, -30, 0, -55);
        ctx.bezierCurveTo(20, -25, 40, 20, 20, 65);
      });
      break;

    case 'lotus':
      // Sacred blooming lotus for spiritual / soulful songs
      renderGlow(() => {
        ctx.beginPath();
        // Center petal
        ctx.moveTo(0, -100);
        ctx.bezierCurveTo(-30, -50, -30, 20, 0, 50);
        ctx.moveTo(0, -100);
        ctx.bezierCurveTo(30, -50, 30, 20, 0, 50);
        // Left petal
        ctx.moveTo(0, 45);
        ctx.bezierCurveTo(-55, 25, -95, -20, -75, -75);
        ctx.bezierCurveTo(-65, -35, -30, 0, 0, 35);
        // Right petal
        ctx.moveTo(0, 45);
        ctx.bezierCurveTo(55, 25, 95, -20, 75, -75);
        ctx.bezierCurveTo(65, -35, 30, 0, 0, 35);
        // Base cup
        ctx.moveTo(-60, 50);
        ctx.bezierCurveTo(-30, 75, 30, 75, 60, 50);
      });
      break;

    case 'rose':
    default:
      // Classic vector continuous line rose
      renderGlow(() => {
        ctx.beginPath();
        // Stem
        ctx.moveTo(0, 40);
        ctx.bezierCurveTo(-15, 120, 20, 220, -5, 320);
        // Leaves
        ctx.moveTo(8, 150);
        ctx.bezierCurveTo(60, 120, 85, 165, 75, 195);
        ctx.bezierCurveTo(40, 205, 15, 175, 8, 170);
        ctx.moveTo(-6, 210);
        ctx.bezierCurveTo(-60, 180, -85, 225, -75, 255);
        ctx.bezierCurveTo(-40, 265, -15, 235, -6, 230);
        // Calyx
        ctx.moveTo(-35, 40);
        ctx.bezierCurveTo(-20, 65, 20, 65, 35, 40);
        // Outer Petals
        ctx.moveTo(-15, 40);
        ctx.bezierCurveTo(-75, 20, -90, -50, -55, -90);
        ctx.bezierCurveTo(-25, -115, 10, -90, 0, -60);
        ctx.moveTo(15, 40);
        ctx.bezierCurveTo(75, 20, 90, -50, 55, -90);
        ctx.bezierCurveTo(25, -115, -10, -90, 0, -60);
        // Heart cup
        ctx.moveTo(-45, -45);
        ctx.bezierCurveTo(-40, 5, 40, 5, 45, -45);
        // Inner swirl
        ctx.moveTo(-25, -70);
        ctx.bezierCurveTo(-35, -95, 0, -115, 25, -90);
        ctx.bezierCurveTo(40, -70, 25, -40, 0, -45);
        ctx.bezierCurveTo(-15, -45, -20, -65, -5, -75);
      });
      break;
  }

  ctx.restore();
}

if (typeof window !== 'undefined') {
  window.drawNeonSymbol = drawNeonSymbol;
  window.drawNeonRose = function(ctx, cx, cy, scale = 1.35, alpha = 1.0, pulse = 0.0, accent = '#ff2a85', light = '#ffa6d2') {
    drawNeonSymbol('rose', ctx, cx, cy, scale, pulse, accent, light);
  };
}

