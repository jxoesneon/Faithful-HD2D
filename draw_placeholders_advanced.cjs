const fs = require('fs');
const path = require('path');
const spriteData = require('./docs/sprite-mappings.json');

const outDir = path.join(__dirname, 'public', 'assets', 'sprites');
fs.mkdirSync(outDir, { recursive: true });

// Colors for factions
const factionColors = {
    ani: { primary: '#16a34a', secondary: '#4ade80', dark: '#14532d', highlight: '#bbf7d0', theme: 'Animist' },
    tec: { primary: '#2563eb', secondary: '#60a5fa', dark: '#1e3a8a', highlight: '#bfdbfe', theme: 'Technocrat' },
    int: { primary: '#ea580c', secondary: '#fb923c', dark: '#7c2d12', highlight: '#ffedd5', theme: 'Interventionist' },
    nih: { primary: '#dc2626', secondary: '#f87171', dark: '#7f1d1d', highlight: '#fee2e2', theme: 'Nihilist' },
    ele: { primary: '#d97706', secondary: '#fbbf24', dark: '#78350f', highlight: '#fef3c7', theme: 'Elemental' },
    uni: { primary: '#4b5563', secondary: '#9ca3af', dark: '#111827', highlight: '#f3f4f6', theme: 'Universal' }
};

// Map sheets to their type
function getSheetType(sheetId) {
    if (sheetId.startsWith('char-') || sheetId.startsWith('fauna-') || sheetId.includes('vehicles')) return 'character';
    if (sheetId.startsWith('bldg-')) return 'building';
    if (sheetId.startsWith('flora-trees') || sheetId.startsWith('flora-exotic')) return 'tree';
    if (sheetId.startsWith('flora-crops')) return 'crop';
    if (sheetId.startsWith('geo-')) return 'geology';
    if (sheetId.startsWith('terrain-')) return 'terrain';
    if (sheetId.startsWith('vfx-')) return 'vfx';
    if (sheetId.startsWith('equip-')) return 'equip';
    return 'default';
}

function getFaction(sheetId) {
    if (sheetId.includes('animist')) return 'ani';
    if (sheetId.includes('technocrat')) return 'tec';
    if (sheetId.includes('interventionist')) return 'int';
    if (sheetId.includes('nihilist')) return 'nih';
    if (sheetId.includes('elemental')) return 'ele';
    return 'uni';
}

const entityClasses = {
    // Animist Faction Characters
    char_ani_gatherer: { name: 'Gatherer', headAttr: 'leaf', tool: 'basket' },
    char_ani_woodsman: { name: 'Woodsman', headAttr: 'cap', tool: 'axe' },
    char_ani_hunter: { name: 'Hunter', headAttr: 'hood', tool: 'bow' },
    char_ani_beastmaster: { name: 'Beastmaster', headAttr: 'horns', tool: 'wolf' },
    char_ani_shaman: { name: 'Shaman', headAttr: 'feather', tool: 'glowing_staff' },
    char_ani_warrior: { name: 'Warrior', headAttr: 'bandana', tool: 'spear_shield' },
    char_ani_chieftain: { name: 'Chieftain', headAttr: 'antlers', tool: 'scepter' },
    char_ani_ent: { name: 'Ent (Giant)', headAttr: 'branches', tool: 'fists', scale: 1.8 }
};

for (const sheetId of Object.keys(spriteData.sheets)) {
    const sheetType = getSheetType(sheetId);
    const factionKey = getFaction(sheetId);
    const colors = factionColors[factionKey];
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 4096 4096">\n`;
    svg += `<rect width="4096" height="4096" fill="#030406" />\n`;
    
    // Draw 8x8 cells
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const x = c * 512;
            const y = r * 512;
            const cx = x + 256;
            const cy = y + 256;
            
            // Core isometric tile base
            svg += `  <!-- CELL Col:${c} Row:${r} -->\n`;
            svg += `  <rect x="${x + 8}" y="${y + 8}" width="496" height="496" fill="none" stroke="#ffffff03" stroke-width="2" />\n`;
            
            // Subdued floor tile
            svg += `  <path d="M ${cx} ${y + 112} L ${x + 448} ${cy} L ${cx} ${y + 400} L ${x + 64} ${cy} Z" fill="#0d1017" stroke="#ffffff0d" stroke-width="4" />\n`;
            
            if (sheetType === 'character') {
                // Determine layout & parameters
                const targetScale = 1.0;
                let poseY = cy + 20; // base offset
                let poseX = cx;
                
                // Animation frame calculations
                let bodyOffset = 0;
                let headOffset = 0;
                let leftLegAngle = 0;
                let rightLegAngle = 0;
                let rightArmAngle = 0;
                let leftArmAngle = 0;
                let isDead = false;
                let isAttacking = false;
                let motionSlash = '';
                
                if (c === 0) { // Idle 1
                    bodyOffset = -2;
                    headOffset = 1;
                } else if (c === 1) { // Idle 2
                    bodyOffset = 2;
                    headOffset = -1;
                } else if (c === 2) { // Walk 1
                    bodyOffset = -1;
                    leftLegAngle = -25;
                    rightLegAngle = 15;
                    rightArmAngle = -15;
                    leftArmAngle = 20;
                } else if (c === 3) { // Walk 2
                    bodyOffset = 3;
                    leftLegAngle = 0;
                    rightLegAngle = 0;
                    rightArmAngle = 0;
                    leftArmAngle = 0;
                } else if (c === 4) { // Walk 3
                    bodyOffset = -1;
                    leftLegAngle = 20;
                    rightLegAngle = -25;
                    rightArmAngle = 15;
                    leftArmAngle = -15;
                } else if (c === 5) { // Action 1 (Windup)
                    bodyOffset = 4;
                    headOffset = -2;
                    rightLegAngle = -10;
                    rightArmAngle = -65;
                    leftArmAngle = 30;
                } else if (c === 6) { // Action 2 (Strike)
                    bodyOffset = -4;
                    poseX += 15;
                    headOffset = 2;
                    rightArmAngle = 55;
                    leftArmAngle = -35;
                    isAttacking = true;
                    // Yellow wind slash line
                    motionSlash = `    <path d="M ${cx + 35} ${cy - 50} Q ${cx + 120} ${cy - 10} ${cx + 70} ${cy + 40}" stroke="#fbbf24" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.9" filter="drop-shadow(0 0 8px #f59e0b)"/>\n`;
                } else if (c === 7) { // Death
                    isDead = true;
                }
                
                if (isDead) {
                    // Draw a blood/spirit pool
                    svg += `  <ellipse cx="${cx}" cy="${cy + 50}" rx="120" ry="40" fill="${colors.dark}" opacity="0.6" filter="blur(4px)" />\n`;
                    // Fallen character
                    svg += `  <g transform="translate(${cx}, ${cy + 60}) rotate(90) scale(1)">\n`;
                } else {
                    // Shadow
                    svg += `  <ellipse cx="${cx}" cy="${cy + 100}" rx="64" ry="24" fill="#000000" opacity="0.4" />\n`;
                    svg += `  <g transform="translate(${poseX}, ${poseY + bodyOffset})">\n`;
                }
                
                // Head attributes, clothing & limbs (using custom themes)
                const charPrimary = colors.primary;
                const charSec = colors.secondary;
                const charDark = colors.dark;
                
                // Draw Legs
                if (!isDead) {
                    // Left Leg
                    svg += `    <g transform="translate(-16, 40) rotate(${leftLegAngle})">\n`;
                    svg += `      <rect x="-8" y="0" width="16" height="40" fill="${charDark}" rx="4" />\n`;
                    svg += `      <rect x="-10" y="32" width="22" height="12" fill="#2d3748" rx="3" />\n`;
                    svg += `    </g>\n`;
                    // Right Leg
                    svg += `    <g transform="translate(16, 40) rotate(${rightLegAngle})">\n`;
                    svg += `      <rect x="-8" y="0" width="16" height="40" fill="${charDark}" rx="4" />\n`;
                    svg += `      <rect x="-8" y="32" width="22" height="12" fill="#2d3748" rx="3" />\n`;
                    svg += `    </g>\n`;
                }
                
                // Torso
                svg += `    <rect x="-28" y="-40" width="56" height="80" fill="${charPrimary}" rx="16" stroke="${charSec}" stroke-width="4" />\n`;
                // Fabric Vest collar/lines
                svg += `    <path d="M -12 -40 L 0 -10 L 12 -40" stroke="${colors.highlight}" stroke-width="4" fill="none" />\n`;
                
                // Left Arm
                svg += `    <g transform="translate(-32, -24) rotate(${leftArmAngle})">\n`;
                svg += `      <rect x="-12" y="0" width="14" height="48" fill="${charPrimary}" rx="6" />\n`;
                svg += `    </g>\n`;
                
                // Right Arm (Holding Tool)
                svg += `    <g transform="translate(32, -24) rotate(${rightArmAngle})">\n`;
                svg += `      <rect x="-2" y="0" width="14" height="48" fill="${charPrimary}" rx="6" />\n`;
                
                // Draw tool / weapon within the right arm group
                if (factionKey === 'ani') {
                    // Draw different items based on Row
                    if (r === 0) { // Gatherer basket
                        svg += `      <rect x="-16" y="35" width="24" height="24" fill="#ca8a04" rx="4" stroke="#854d0e" stroke-width="2"/>\n`;
                    } else if (r === 1) { // Woodsman Axe
                        svg += `      <line x1="4" y1="20" x2="4" y2="70" stroke="#78350f" stroke-width="6" />\n`;
                        svg += `      <path d="M 4 20 L -20 10 L -20 35 L 4 30 Z" fill="#9ca3af" stroke="#4b5563" stroke-width="2" />\n`;
                    } else if (r === 2) { // Hunter bow
                        svg += `      <path d="M 15 -20 Q -5 25 15 70" fill="none" stroke="#b45309" stroke-width="6" stroke-linecap="round"/>\n`;
                        svg += `      <line x1="15" y1="-20" x2="15" y2="70" stroke="#ffffff33" stroke-width="2" />\n`;
                    } else if (r === 4) { // Shaman staff
                        svg += `      <line x1="4" y1="-30" x2="4" y2="80" stroke="#78350f" stroke-width="6" />\n`;
                        svg += `      <circle cx="4" cy="-36" r="14" fill="#a7f3d0" stroke="#059669" stroke-width="4" filter="drop-shadow(0 0 6px #34d399)"/>\n`;
                    } else if (r === 5 || r === 6) { // Warrior Or scepter
                        svg += `      <line x1="4" y1="-20" x2="4" y2="90" stroke="#e2e8f0" stroke-width="4" />\n`;
                        svg += `      <path d="M 4 -20 L -10 -45 L 4 -60 L 18 -45 Z" fill="#94a3b8" />\n`;
                    }
                } else if (factionKey === 'tec') {
                    // Sci-fi tools
                    if (r === 3 || r === 4) { // Solders hover rifle
                        svg += `      <rect x="-2" y="25" width="35" height="12" fill="#334155" rx="2"/>\n`;
                        svg += `      <line x1="33" y1="31" x2="45" y2="31" stroke="#38bdf8" stroke-width="4" />\n`;
                    } else { // Industrial wrench / welding tool
                        svg += `      <rect x="2" y="25" width="8" height="30" fill="#64748b" />\n`;
                        svg += `      <circle cx="6" cy="25" r="8" fill="#475569" stroke="#1e293b" stroke-width="2"/>\n`;
                    }
                } else {
                    // Default generic items for fallback rows
                    svg += `      <line x1="4" y1="-10" x2="4" y2="60" stroke="#78350f" stroke-width="4" />\n`;
                }
                
                svg += `    </g>\n`;
                
                // Head (Bobbing up/down based on offset)
                svg += `    <g transform="translate(0, -60) translate(0, ${headOffset})">\n`;
                // Face / skin
                svg += `      <circle cx="0" cy="0" r="22" fill="#fbcfe8" />\n`;
                
                // Eyes (X eyes if dead)
                if (isDead) {
                    svg += `      <line x1="-10" y1="-4" x2="-4" y2="2" stroke="#475569" stroke-width="3" />\n`;
                    svg += `      <line x1="-4" y1="-4" x2="-10" y2="2" stroke="#475569" stroke-width="3" />\n`;
                    svg += `      <line x1="4" y1="-4" x2="10" y2="2" stroke="#475569" stroke-width="3" />\n`;
                    svg += `      <line x1="10" y1="-4" x2="4" y2="2" stroke="#475569" stroke-width="3" />\n`;
                } else {
                    svg += `      <circle cx="-7" cy="-2" r="3.5" fill="#1e293b" />\n`;
                    svg += `      <circle cx="7" cy="-2" r="3.5" fill="#1e293b" />\n`;
                }
                
                // Specialized Faction / Class Hair / Headgear
                if (factionKey === 'ani') {
                    if (r === 4) { // Shaman feather
                        svg += `        <path d="M 0 -22 Q -15 -50 -5 -65 Q 10 -50 0 -22" fill="#a855f7" stroke="#dc2626" stroke-width="2"/>\n`;
                    } else if (r === 6) { // Chieftain antlers / massive crown
                        svg += `        <path d="M -15 -22 L -35 -45 L -25 -52 L -30 -62" stroke="#ca8a04" stroke-width="4" fill="none" stroke-linecap="round"/>\n`;
                        svg += `        <path d="M 15 -22 L 35 -45 L 25 -52 L 30 -62" stroke="#ca8a04" stroke-width="4" fill="none" stroke-linecap="round"/>\n`;
                    } else if (r === 7) { // Giant Ent wooden branches
                        svg += `        <path d="M -8 -22 L -20 -40 L -12 -50" stroke="#78350f" stroke-width="6" fill="none"/>\n`;
                        svg += `        <path d="M 8 -22 L 20 -40 L 12 -50" stroke="#78350f" stroke-width="6" fill="none"/>\n`;
                        svg += `        <circle cx="0" cy="-30" r="16" fill="#15803d" opacity="0.8"/>\n`;
                    } else { // Cute leaves cap
                        svg += `        <path d="M -24 -6 C -20 -35 20 -35 24 -6 Z" fill="#15803d" />\n`;
                        svg += `        <path d="M 0 -25 L 0 -35" stroke="#166534" stroke-width="3" />\n`;
                    }
                } else if (factionKey === 'tec') {
                    // Tech Helmets / glowing visors
                    svg += `        <path d="M -24 -10 C -24 -35 24 -35 24 -10 Z" fill="#475569" />\n`;
                    svg += `        <rect x="-18" y="-14" width="36" height="8" fill="#38bdf8" rx="2" stroke="#0ea5e9" stroke-width="2" filter="drop-shadow(0 0 4px #06b6d4)"/>\n`;
                } else if (factionKey === 'int') {
                    // Golden crowns or halos
                    svg += `        <ellipse cx="0" cy="-32" rx="24" ry="8" fill="none" stroke="#fbbf24" stroke-width="4" filter="drop-shadow(0 0 5px #f59e0b)"/>\n`;
                } else {
                    // Hair/Cap fallback
                    svg += `        <path d="M -22 -6 C -22 -28 22 -28 22 -6 Z" fill="#78350f" />\n`;
                }
                
                svg += `    </g>\n`; // Head group ends
                svg += `  </g>\n`; // Body group ends
                
                if (isAttacking) {
                    svg += motionSlash; // Action effect
                }
                
            } else if (sheetType === 'building') {
                // Draw various phases
                if (c === 0) { // Foundation
                    svg += `  <path d="M ${cx} ${cy - 20} L ${cx + 120} ${cy + 40} L ${cx} ${cy + 100} L ${cx - 120} ${cy + 40} Z" fill="#4b5563" stroke="#9ca3af" stroke-width="6" />\n`;
                    svg += `  <line x1="${cx - 80}" y1="${cy + 50}" x2="${cx + 80}" y2="${cy + 50}" stroke="#f3f4f6" stroke-width="4" stroke-dasharray="8 8" />\n`;
                    svg += `  <circle cx="${cx}" cy="${cy + 40}" r="20" fill="#374151" />\n`;
                } else if (c === 1) { // Scaffold
                    svg += `  <path d="M ${cx} ${cy - 20} L ${cx + 120} ${cy + 40} L ${cx} ${cy + 100} L ${cx - 120} ${cy + 40} Z" fill="#78350f" opacity="0.6" />\n`;
                    svg += `  <line x1="${cx - 90}" y1="${cy + 50}" x2="${cx - 90}" y2="${cy - 90}" stroke="#b45309" stroke-width="6" />\n`;
                    svg += `  <line x1="${cx + 90}" y1="${cy + 50}" x2="${cx + 90}" y2="${cy - 90}" stroke="#b45309" stroke-width="6" />\n`;
                    svg += `  <line x1="${cx - 90}" y1="${cy - 40}" x2="${cx + 90}" y2="${cy - 40}" stroke="#d97706" stroke-width="4" />\n`;
                } else {
                    // Fully build shapes based on column variables
                    const activeAnim = (c === 4 || c === 5);
                    const isDamaged = (c === 6);
                    const isRuined = (c === 7);
                    
                    if (isRuined) {
                        // Pile of rubbles
                        svg += `  <path d="M ${cx - 120} ${cy + 40} Q ${cx} ${cy - 10} ${cx + 120} ${cy + 40} Q ${cx} ${cy + 90} ${cx - 120} ${cy + 40}" fill="#374151" stroke="#1f2937" stroke-width="4" />\n`;
                        svg += `  <path d="M ${cx - 40} ${cy + 20} L ${cx - 10} ${cy - 10} L ${cx + 30} ${cy + 30}" stroke="#78350f" stroke-width="10" stroke-linecap="round" fill="none" />\n`;
                        svg += `  <circle cx="${cx + 50}" cy="${cy + 20}" r="14" fill="#6b7280" />\n`;
                    } else {
                        // Beautiful isometric buildings with roofs and walls
                        const primaryColor = colors.primary;
                        const secColor = colors.secondary;
                        const darkColor = colors.dark;
                        
                        // Left Wall
                        svg += `  <path d="M ${cx - 120} ${cy + 30} L ${cx} ${cy + 90} L ${cx} ${cy - 30} L ${cx - 120} ${cy - 90} Z" fill="${darkColor}" stroke="${secColor}" stroke-width="3" />\n`;
                        // Right Wall
                        svg += `  <path d="M ${cx} ${cy + 90} L ${cx + 120} ${cy + 30} L ${cx + 120} ${cy - 90} L ${cx} ${cy - 30} Z" fill="${primaryColor}" stroke="${secColor}" stroke-width="3" />\n`;
                        
                        // Overhanging roof (Pyramidal or Flat based on faction)
                        if (factionKey === 'ani') {
                            // Thatched triangular roof
                            svg += `  <path d="M ${cx - 130} ${cy - 80} L ${cx} ${cy - 200} L ${cx + 130} ${cy - 80} L ${cx} ${cy - 20} Z" fill="#ca8a04" stroke="#854d0e" stroke-width="4" />\n`;
                        } else if (factionKey === 'tec') {
                            // High sci-fi flat solar deck roof
                            svg += `  <path d="M ${cx - 130} ${cy - 80} L ${cx} ${cy - 140} L ${cx + 130} ${cy - 80} L ${cx} ${cy - 20} Z" fill="#0284c7" stroke="#38bdf8" stroke-width="4" />\n`;
                        } else {
                            // Classical temple roof
                            svg += `  <path d="M ${cx - 130} ${cy - 80} L ${cx} ${cy - 160} L ${cx + 130} ${cy - 80} L ${cx} ${cy - 20} Z" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="4" />\n`;
                        }
                        
                        // Door
                        svg += `  <path d="M ${cx + 40} ${cy + 70} L ${cx + 70} ${cy + 55} L ${cx + 70} ${cy + 15} L ${cx + 40} ${cy + 30} Z" fill="#451a03" />\n`;
                        
                        // Windows (Glowing if Active)
                        const windowFill = (c === 3 || activeAnim) ? '#fde047' : '#1e293b';
                        const wGlow = (c === 3 || activeAnim) ? 'filter="drop-shadow(0 0 6px #facc15)"' : '';
                        svg += `  <rect x="${cx - 70}" y="${cy - 20}" width="24" height="24" fill="${windowFill}" ${wGlow} rx="4" transform="skewY(25)" />\n`;
                        
                        if (activeAnim) {
                            // Draw dynamic visual details (particles or smoke or flags)
                            svg += `  <path d="M ${cx} ${cy - 210} Q ${cx - 30} ${cy - 250} ${cx - 10} ${cy - 290} T ${cx - 40} ${cy - 340}" fill="none" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round" opacity="0.6" />\n`;
                            svg += `  <circle cx="${cx - 10}" cy="${cy - 300}" r="15" fill="#10b981" opacity="0.3" filter="blur(6px)" />\n`;
                        }
                        
                        if (isDamaged) {
                            // Fire & Crack indicators
                            svg += `  <path d="M ${cx - 30} ${cy + 20} L ${cx - 10} ${cy + 60}" stroke="#ea580c" stroke-width="5" />\n`;
                            // Amber fire
                            svg += `  <path d="M ${cx - 10} ${cy - 40} Q ${cx + 20} ${cy - 90} ${cx + 5} ${cy - 35} Z" fill="#f97316" stroke="#ef4444" stroke-width="3" />\n`;
                        }
                    }
                }
            } else if (sheetType === 'tree') {
                // Growth and wind simulation
                const isStump = (c === 7);
                const isFalling = (c === 6);
                
                if (isStump) {
                    svg += `  <ellipse cx="${cx}" cy="${cy + 60}" rx="32" ry="12" fill="#78350f" stroke="#451a03" stroke-width="4" />\n`;
                    svg += `  <path d="M ${cx - 32} ${cy + 60} Q ${cx} ${cy + 80} ${cx + 32} ${cy + 60}" stroke="#78350f" stroke-width="6" />\n`;
                } else {
                    let leanX = 0;
                    let rotateVal = 0;
                    let shakeOffset = 0;
                    
                    if (c === 1) leanX = 20;       // sway right
                    if (c === 3) leanX = -20;      // sway left
                    if (c === 4) shakeOffset = 10; // hit shake
                    if (c === 5) { leanX = 40; rotateVal = 25; } // hit snap
                    if (isFalling) { rotateVal = 75; leanX = 140; } // falling
                    
                    svg += `  <g transform="translate(${cx + shakeOffset}, ${cy + 60}) rotate(${rotateVal})">\n`;
                    // Trunk
                    svg += `    <path d="M -16 0 L -8 -130 L 8 -130 L 16 0 Z" fill="#78350f" stroke="#451a03" stroke-width="4" />\n`;
                    
                    // Foliage
                    const folColor = (r % 2 === 0) ? '#166534' : '#15803d';
                    const folBorder = (r % 2 === 0) ? '#14532d' : '#166534';
                    svg += `    <circle cx="${leanX}" cy="-150" r="75" fill="${folColor}" stroke="${folBorder}" stroke-width="6" />\n`;
                    svg += `    <circle cx="${leanX - 45}" cy="-120" r="50" fill="${folColor}" />\n`;
                    svg += `    <circle cx="${leanX + 45}" cy="-120" r="50" fill="${folColor}" />\n`;
                    
                    if (r === 6) { // Cactus rows
                        svg += `    <rect x="-10" y="-120" width="20" height="120" fill="#15803d" stroke="#166534" stroke-width="4"/>\n`;
                        svg += `    <path d="M -10 -70 L -30 -70 L -30 -100" fill="none" stroke="#15803d" stroke-width="16" stroke-linecap="round"/>\n`;
                        svg += `    <path d="M 10 -50 L 30 -50 L 30 -80" fill="none" stroke="#15803d" stroke-width="16" stroke-linecap="round"/>\n`;
                    }
                    svg += `  </g>\n`;
                }
            } else if (sheetType === 'crop') {
                // Growth cycles: 0 to 7
                if (c === 0) { // Seeded
                    svg += `  <ellipse cx="${cx}" cy="${cy + 65}" rx="16" ry="6" fill="#451a03" />\n`;
                    svg += `  <circle cx="${cx}" cy="${cy + 60}" r="4" fill="#fbbf24" />\n`;
                } else if (c === 1) { // Sprout
                    svg += `  <ellipse cx="${cx}" cy="${cy + 65}" rx="24" ry="8" fill="#451a03" />\n`;
                    svg += `  <path d="M ${cx} ${cy + 65} Q ${cx - 15} ${cy + 30} ${cx - 10} ${cy + 15}" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round" />\n`;
                } else if (c === 2) { // Young
                    svg += `  <path d="M ${cx} ${cy + 65} Q ${cx + 10} ${cy + 20} ${cx - 5} ${cy - 10}" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" />\n`;
                    svg += `  <path d="M ${cx} ${cy + 65} Q ${cx - 20} ${cy + 40} ${cx - 25} ${cy + 10}" fill="none" stroke="#4ade80" stroke-width="4" />\n`;
                } else if (c === 3 || c === 4) { // Mature 1 / 2 (Swaying)
                    const wAngle = (c === 4) ? 15 : -10;
                    svg += `  <g transform="translate(${cx}, ${cy + 60}) rotate(${wAngle})">\n`;
                    svg += `    <path d="M 0 0 L 0 -80" stroke="#15803d" stroke-width="6" stroke-linecap="round"/>\n`;
                    // Beautiful ripe heads
                    svg += `    <circle cx="0" cy="-80" r="14" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>\n`;
                    svg += `    <circle cx="-10" cy="-60" r="10" fill="#fef08a" />\n`;
                    svg += `    <circle cx="10" cy="-60" r="10" fill="#fef08a" />\n`;
                    svg += `  </g>\n`;
                } else if (c === 5) { // Harvested
                    svg += `  <path d="M ${cx - 15} ${cy + 60} Q ${cx} ${cy + 55} ${cx + 15} ${cy + 60}" stroke="#78350f" stroke-width="6" />\n`;
                    svg += `  <line x1="${cx - 10}" y1="${cy + 60}" x2="${cx - 10}" y2="${cy + 45}" stroke="#b45309" stroke-width="4" />\n`;
                    svg += `  <line x1="${cx + 10}" y1="${cy + 60}" x2="${cx + 10}" y2="${cy + 45}" stroke="#b45309" stroke-width="4" />\n`;
                } else if (c === 6) { // Withered
                    svg += `  <g transform="translate(${cx}, ${cy + 60}) rotate(45)">\n`;
                    svg += `    <path d="M 0 0 L 0 -60" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>\n`;
                    svg += `    <circle cx="0" cy="-60" r="10" fill="#a16207" />\n`;
                    svg += `  </g>\n`;
                } else if (c === 7) { // Rotted compost
                    svg += `  <ellipse cx="${cx}" cy="${cy + 65}" rx="60" ry="20" fill="#451a03" />\n`;
                    svg += `  <path d="M ${cx - 30} ${cy + 60} Q ${cx} ${cy + 50} ${cx + 35} ${cy + 65}" stroke="#1c1917" stroke-width="10" stroke-linecap="round" fill="none"/>\n`;
                }
            } else if (sheetType === 'geology') {
                // Ore extraction configurations: 0 to 7
                const isDust = (c === 7);
                const isCrumbling = (c === 6);
                const isDepleted = (c === 5);
                
                if (isDust) {
                    svg += `  <ellipse cx="${cx}" cy="${cy + 60}" rx="80" ry="25" fill="#4b5563" opacity="0.4" filter="blur(4px)" />\n`;
                    svg += `  <circle cx="${cx - 20}" cy="${cy + 55}" r="8" fill="#374151" />\n`;
                    svg += `  <circle cx="${cx + 30}" cy="${cy + 65}" r="6" fill="#374151" />\n`;
                } else if (isDepleted) {
                    // Hollowed crater
                    svg += `  <path d="M ${cx - 60} ${cy + 60} Q ${cx} ${cy + 90} ${cx + 60} ${cy + 60} Q ${cx} ${cy + 30} ${cx - 60} ${cy + 60}" fill="#0f172a" stroke="#334155" stroke-width="6" />\n`;
                } else {
                    let scaleGeo = 1.0;
                    let colorOre = colors.primary;
                    let strokeColor = colors.secondary;
                    let crackLines = false;
                    
                    if (c === 1) scaleGeo = 1.1; // Sparkly/glowing pulse
                    if (c === 2) { scaleGeo = 0.95; crackLines = true; } // slightly chipped
                    if (c === 3) { scaleGeo = 0.75; crackLines = true; } // half mined
                    if (c === 4) { scaleGeo = 0.55; crackLines = true; } // mostly rubble
                    if (isCrumbling) { scaleGeo = 0.45; crackLines = true; }
                    
                    svg += `  <g transform="translate(${cx}, ${cy + 40}) scale(${scaleGeo})">\n`;
                    // Core 3D crystal/rock block
                    svg += `    <path d="M 0 -80 L 70 -40 L 70 30 L 0 80 L -70 30 L -70 -40 Z" fill="${colorOre}" stroke="${strokeColor}" stroke-width="6" />\n`;
                    // Crystal facets & shine
                    svg += `    <path d="M 0 -80 L 0 80" stroke="${colors.highlight}" stroke-width="3" opacity="0.6" />\n`;
                    svg += `    <path d="M 0 0 L 70 -40" stroke="${colors.highlight}" stroke-width="3" opacity="0.6" />\n`;
                    svg += `    <path d="M 0 0 L -70 -40" stroke="${colors.highlight}" stroke-width="3" opacity="0.6" />\n`;
                    
                    if (crackLines) {
                        // Jagged cracking overlays
                        svg += `    <path d="M -30 -30 L -10 -10 L 20 -20 L 40 10 M -40 10 L -10 20 L 10 0" stroke="#000000" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.8"/>\n`;
                    }
                    
                    if (c === 1) { // Magical light gleams
                        svg += `    <circle cx="-30" cy="-50" r="16" fill="#ffffff" opacity="0.7" filter="blur(4px)" />\n`;
                        svg += `    <circle cx="30" cy="-30" r="12" fill="#ffffff" opacity="0.7" filter="blur(4px)" />\n`;
                    }
                    svg += `  </g>\n`;
                }
            } else if (sheetType === 'vfx') {
                // VFX scales exponentially from frame 0 through 7
                const scaleVal = 0.1 + (c * 0.18);
                const isDecal = (c === 7);
                
                if (isDecal) {
                    svg += `  <ellipse cx="${cx}" cy="${cy + 55}" rx="120" ry="35" fill="none" stroke="${colors.primary}" stroke-width="8" opacity="0.4" />\n`;
                } else {
                    svg += `  <g transform="translate(${cx}, ${cy}) scale(${scaleVal})">\n`;
                    const coreGlow = (sheetId.includes('disasters')) ? '#ef4444' : '#10b981';
                    const ringGlow = (sheetId.includes('disasters')) ? '#f97316' : '#6ee7b7';
                    // Beautiful radiating particle mandala
                    svg += `    <circle cx="0" cy="0" r="180" fill="none" stroke="${ringGlow}" stroke-width="20" opacity="0.8" stroke-dasharray="40 20" />\n`;
                    svg += `    <circle cx="0" cy="0" r="120" fill="none" stroke="${coreGlow}" stroke-width="14" stroke-dasharray="20 10" />\n`;
                    svg += `    <circle cx="0" cy="0" r="60" fill="${coreGlow}" filter="blur(12px)"/>\n`;
                    svg += `    <path d="M -150 0 L 150 0 M 0 -150 L 0 150 M -100 -100 L 100 100 M -100 100 L 100 -100" stroke="#ffffff" stroke-width="12" opacity="0.9" />\n`;
                    svg += `  </g>\n`;
                }
            } else if (sheetType === 'equip') {
                // Floating overlay equipment items
                const isDropped = (c === 7);
                let equipY = (isDropped) ? cy + 45 : cy - 20 + Math.sin(c) * 10;
                
                if (isDropped) {
                    svg += `  <ellipse cx="${cx}" cy="${cy + 60}" rx="45" ry="16" fill="#000" opacity="0.3" />\n`;
                }
                
                svg += `  <g transform="translate(${cx}, ${equipY})">\n`;
                if (sheetId.includes('weapons')) {
                    // Wieldable items
                    svg += `    <line x1="-60" y1="30" x2="60" y2="-30" stroke="${colors.primary}" stroke-width="12" stroke-linecap="round"/>\n`;
                    svg += `    <path d="M 40 -20 L 70 -50 L 50 -60 L 20 -30 Z" fill="${colors.secondary}" stroke="#ffffff" stroke-width="3" />\n`;
                } else {
                    // Shield or helmet
                    svg += `    <path d="M -40 -30 C -40 -60 40 -60 40 -30 L 30 20 C 15 40 -15 40 -30 20 Z" fill="${colors.primary}" stroke="${colors.secondary}" stroke-width="6" />\n`;
                    svg += `    <ellipse cx="0" cy="-20" rx="14" ry="14" fill="${colors.highlight}" />\n`;
                }
                svg += `  </g>\n`;
            } else if (sheetType === 'terrain') {
                // High density details for terrain tiles
                svg += `  <path d="M ${cx} ${y + 112} L ${x + 448} ${cy} L ${cx} ${y + 400} L ${x + 64} ${cy} Z" fill="${colors.primary}" stroke="${colors.secondary}" stroke-width="12" />\n`;
                
                // Active liquid/terrain surface animations
                const waveShift = Math.sin(c * 0.7) * 20;
                svg += `  <path d="M ${cx - 100 + waveShift} ${cy} Q ${cx + waveShift} ${cy - 20} ${cx + 100 + waveShift} ${cy}" fill="none" stroke="${colors.highlight}" stroke-width="6" opacity="0.5" stroke-linecap="round"/>\n`;
                svg += `  <path d="M ${cx - 140 - waveShift} ${cy + 40} Q ${cx - waveShift} ${cy + 20} ${cx + 140 - waveShift} ${cy + 40}" fill="none" stroke="${colors.highlight}" stroke-width="4" opacity="0.3" stroke-linecap="round"/>\n`;
            } else {
                // Fallback grid cells
                svg += `  <circle cx="${cx}" cy="${cy}" r="32" fill="${colors.primary}" />\n`;
            }
            
            // Grid label details for visual perfection
            svg += `  <text x="${x + 64}" y="${y + 70}" fill="rgba(255,255,255,0.25)" font-family="'Courier New', Courier, monospace" font-size="22" font-weight="bold">COL ${c}</text>\n`;
            svg += `  <text x="${x + 64}" y="${y + 100}" fill="rgba(255,255,255,0.25)" font-family="'Courier New', Courier, monospace" font-size="22" font-weight="bold">ROW ${r}</text>\n`;
        }
    }
    
    svg += `</svg>`;
    fs.writeFileSync(path.join(outDir, `${sheetId}.svg`), svg);
}

console.log('Advanced high-fidelity 4K procedural sprite sheets successfully compiled as vectors!');
