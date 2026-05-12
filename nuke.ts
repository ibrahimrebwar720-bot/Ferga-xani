
import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
const start = 3635; 
const end = 4019; 
const newLines = [...lines.slice(0, start), "// REPLACED", ...lines.slice(end + 1)];
fs.writeFileSync('src/App.tsx', newLines.join('\n'));
console.log('Nuked corrupted section');
