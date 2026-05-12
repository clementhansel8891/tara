import fs from 'fs';

const content = fs.readFileSync('c:/Users/user/Documents/Software-Developer/zenvix-demo/business-flow-suite-v2/src/pages/core/tools/Explorer.tsx', 'utf8');

let o = 0, c = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let commentType = '';

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i+1];

    if (inComment) {
        if (commentType === '//' && char === '\n') inComment = false;
        if (commentType === '/*' && char === '*' && next === '/') { inComment = false; i++; }
        continue;
    }
    if (inString) {
        if (char === stringChar && content[i-1] !== '\\') inString = false;
        continue;
    }

    if (char === '/' && next === '/') { inComment = true; commentType = '//'; i++; continue; }
    if (char === '/' && next === '*') { inComment = true; commentType = '/*'; i++; continue; }
    if (char === "'" || char === '"' || char === '`') { inString = true; stringChar = char; continue; }

    if (char === '{') o++;
    if (char === '}') c++;
}

console.log(`Braces: { ${o}, } ${c}`);
