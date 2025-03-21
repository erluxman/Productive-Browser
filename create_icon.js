const fs = require("fs");
const path = require("path");

// Create an SVG with a 3D-style AI/chatbot icon
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2D3748;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1A202C;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4299E1;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#667EEA;stop-opacity:0.9" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1024" height="1024" rx="224" ry="224" fill="url(#bgGrad)"/>
  
  <!-- Outer circle glow -->
  <circle cx="512" cy="512" r="380" 
    fill="none" 
    stroke="url(#glowGrad)" 
    stroke-width="4"
    filter="url(#glow)"/>
  
  <!-- Robot head base -->
  <path d="M512 312
    a200 200 0 0 1 200 200
    v100
    a200 200 0 0 1 -400 0
    v-100
    a200 200 0 0 1 200 -200z"
    fill="#4A5568"
    stroke="#2D3748"
    stroke-width="8"/>
  
  <!-- Eyes -->
  <circle cx="412" cy="462" r="40" fill="#4299E1" filter="url(#glow)"/>
  <circle cx="612" cy="462" r="40" fill="#4299E1" filter="url(#glow)"/>
  
  <!-- Brain circuits -->
  <path d="M362 362
    q150 -100 300 0
    q-150 100 -300 0"
    fill="none"
    stroke="#667EEA"
    stroke-width="4"
    filter="url(#glow)"/>
  
  <!-- Antenna -->
  <path d="M512 312
    l0 -80
    m-20 0
    l20 -20
    l20 20"
    fill="none"
    stroke="#4299E1"
    stroke-width="8"
    filter="url(#glow)"/>
  
  <!-- Chat bubble -->
  <path d="M712 512
    q100 0 100 100
    q0 80 -60 100
    l20 40
    l-60 -40
    h-100
    q-100 0 -100 -100
    q0 -100 100 -100
    z"
    fill="#2D3748"
    stroke="#4299E1"
    stroke-width="4"
    filter="url(#glow)"/>
  
  <!-- AI nodes in chat bubble -->
  <circle cx="662" cy="562" r="8" fill="#4299E1"/>
  <circle cx="712" cy="562" r="8" fill="#4299E1"/>
  <circle cx="762" cy="562" r="8" fill="#4299E1"/>
  <path d="M662 562 L712 562 L762 562" 
    stroke="#4299E1" 
    stroke-width="2" 
    fill="none"/>
</svg>`;

// Ensure build directory exists
if (!fs.existsSync("build")) {
  fs.mkdirSync("build");
}

// Write the SVG file
fs.writeFileSync(path.join("build", "icon.svg"), svg);

console.log("Icon SVG has been created in build/icon.svg");
console.log("Please convert this to icon.icns using a conversion tool.");
