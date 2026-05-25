const fs = require('fs');
const path = require('path');
const spriteData = require('./docs/sprite-mappings.json');

const outDir = path.join(__dirname, 'public', 'assets', 'sprites');
fs.mkdirSync(outDir, { recursive: true });

for (const sheetId of Object.keys(spriteData.sheets)) {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 4096 4096">\n`;
    svg += `<rect width="4096" height="4096" fill="#050608" />\n`;
    
    // Draw 8x8 grid
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const x = c * 512;
            const y = r * 512;
            
            // Simple color logic
            const hue = (sheetId.charCodeAt(5) * 20 + r*20 + c*10) % 360;
            const color = `hsl(${hue}, 40%, 20%)`;
            const color2 = `hsl(${hue}, 50%, 30%)`;
            
            // Background box
            svg += `  <rect x="${x + 32}" y="${y + 32}" width="448" height="448" fill="${color}" rx="64" stroke="${color2}" stroke-width="12" />\n`;
            
            // Grid lines
            svg += `  <line x1="${x+256}" y1="${y+32}" x2="${x+256}" y2="${y+480}" stroke="#ffffff11" stroke-width="4" stroke-dasharray="10 10"/>\n`;
            svg += `  <line x1="${x+32}" y1="${y+256}" x2="${x+480}" y2="${y+256}" stroke="#ffffff11" stroke-width="4" stroke-dasharray="10 10"/>\n`;
            
            // Isometric diamond representation
            svg += `  <path d="M ${x+256} ${y+128} L ${x+400} ${y+256} L ${x+256} ${y+384} L ${x+112} ${y+256} Z" fill="#ffffff05" stroke="#ffffff22" stroke-width="8"/>\n`;
            
            // Text info
            svg += `  <text x="${x + 256}" y="${y + 230}" fill="white" font-family="'Courier New', Courier, monospace" font-size="56" text-anchor="middle" dominant-baseline="middle" font-weight="900" style="text-shadow: 0 4px 8px rgba(0,0,0,0.5)">C:${c} R:${r}</text>\n`;
            
            // ID text
            const textId = sheetId.split('-')[1] || sheetId.split('-')[0];
            svg += `  <text x="${x + 256}" y="${y + 310}" fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="28" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${textId.toUpperCase()}</text>\n`;
        }
    }
    
    svg += `</svg>`;
    fs.writeFileSync(path.join(outDir, `${sheetId}.svg`), svg);
}
console.log('All 4K placeholder SVGs generated!');
