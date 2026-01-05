const fs = require('fs');
const path = require('path');

// Simple SVG to PNG converter using canvas
// This creates simple text-based icons

const sizes = [128, 192, 512];

const createSVG = (size) => {
  const fontSize = Math.floor(size * 0.5);
  const padding = Math.floor(size * 0.05);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <text
    x="50%"
    y="50%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="monospace"
    font-size="${fontSize}"
    font-weight="bold"
    fill="#22c55e">A</text>
</svg>`;
};

const createMaskableSVG = (size) => {
  const fontSize = Math.floor(size * 0.4);
  const padding = Math.floor(size * 0.1);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - padding}" fill="#0a0a0a"/>
  <text
    x="50%"
    y="50%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="monospace"
    font-size="${fontSize}"
    font-weight="bold"
    fill="#22c55e">A</text>
</svg>`;
};

const publicDir = path.join(__dirname, '..', 'public');

// Generate regular icons
sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `icon-${size}.svg`;
  fs.writeFileSync(path.join(publicDir, filename), svg);
  console.log(`Created ${filename}`);
});

// Generate maskable icon
const maskableSVG = createMaskableSVG(512);
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.svg'), maskableSVG);
console.log('Created icon-maskable-512.svg');

console.log('\nSVG icons created successfully!');
console.log('Note: For production, convert these to PNG using an online tool or imagemagick:');
console.log('  convert icon-128.svg icon-128.png');
console.log('  convert icon-192.svg icon-192.png');
console.log('  convert icon-512.svg icon-512.png');
console.log('  convert icon-maskable-512.svg icon-maskable-512.png');
