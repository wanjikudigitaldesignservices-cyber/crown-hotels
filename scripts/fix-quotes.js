import fs from 'fs';
let content = fs.readFileSync('src/lib/seed-data.ts', 'utf8');
content = content.replaceAll("''", "\\'");
fs.writeFileSync('src/lib/seed-data.ts', content, 'utf8');
console.log('Fixed quotes in src/lib/seed-data.ts');
