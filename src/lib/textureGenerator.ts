import * as THREE from 'three';
import { ProductVisualConfig } from '@/types/product';

const textureCache = new Map<string, THREE.CanvasTexture>();

export function generateProductTexture(config: ProductVisualConfig): THREE.CanvasTexture {
  const cacheKey = `${config.packageType}_${config.primaryColor}_${config.secondaryColor}_${config.label}_${config.subLabel || ''}_${config.badge || ''}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const dummy = new THREE.CanvasTexture(canvas);
    return dummy;
  }

  const {
    primaryColor,
    secondaryColor,
    accentColor = '#facc15',
    textColor = '#ffffff',
    label,
    subLabel,
    badge,
    pattern = 'solid',
  } = config;

  // Background base
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, 512, 512);

  // Pattern / Texture overlay
  if (pattern === 'stripes') {
    ctx.fillStyle = secondaryColor;
    for (let i = 0; i < 512; i += 40) {
      ctx.fillRect(i, 0, 20, 512);
    }
  } else if (pattern === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, primaryColor);
    grad.addColorStop(1, secondaryColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  } else if (pattern === 'dots') {
    ctx.fillStyle = secondaryColor;
    for (let x = 20; x < 512; x += 40) {
      for (let y = 20; y < 512; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Top header banner
  ctx.fillStyle = secondaryColor;
  ctx.fillRect(0, 0, 512, 100);

  // Brand / Category header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AISLE PREMIUM SELECTION', 256, 45);

  // Accent divider line
  ctx.fillStyle = accentColor;
  ctx.fillRect(40, 75, 432, 6);

  // Center display card
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.roundRect(35, 120, 442, 270, 16);
  ctx.fill();

  // Badge if present
  if (badge) {
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(140, 140, 232, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badge.toUpperCase(), 256, 164);
  }

  // Main product title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';

  // Multi-line wrap for label
  const words = label.split(' ');
  if (words.length > 2) {
    const line1 = words.slice(0, 2).join(' ');
    const line2 = words.slice(2).join(' ');
    ctx.fillText(line1, 256, badge ? 225 : 210);
    ctx.fillText(line2, 256, badge ? 265 : 255);
  } else {
    ctx.fillText(label, 256, badge ? 245 : 230);
  }

  // Sub-label / net quantity
  if (subLabel) {
    ctx.fillStyle = '#475569';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(subLabel, 256, 320);
  }

  // Rating stars & barcode graphic at bottom
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('★ ★ ★ ★ ★', 256, 365);

  // Bottom footer section
  ctx.fillStyle = secondaryColor;
  ctx.fillRect(0, 420, 512, 92);

  // Stylized simulated barcode
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(45, 440, 120, 50);
  ctx.fillStyle = '#0f172a';
  for (let b = 55; b < 155; b += 6) {
    const barW = (b % 4 === 0) ? 3 : 1.5;
    ctx.fillRect(b, 445, barW, 40);
  }

  // Verified Seal
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('100% QUALITY GUARANTEED', 470, 465);
  ctx.font = '14px sans-serif';
  ctx.fillText('DIRECT FROM PRODUCER', 470, 485);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

// Procedural floor tile texture for realistic supermarket floor
export function generateFloorTexture(): THREE.CanvasTexture {
  const cacheKey = 'supermarket_floor_tile';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Light warm grey polished terrazzo base
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle flecks and grain
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 2 + 0.5;
    const shade = Math.random() > 0.5 ? 'rgba(255,255,255,0.4)' : 'rgba(148,163,184,0.35)';
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, size, size);
  }

  // Large floor tile grid joints (2x2 tiles per map)
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 508);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  // Subtle inner bevel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, 244, 244);
  ctx.strokeRect(262, 6, 244, 244);
  ctx.strokeRect(6, 262, 244, 244);
  ctx.strokeRect(262, 262, 244, 244);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 16);
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}
