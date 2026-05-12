import fs from 'fs';

const content = fs.readFileSync('c:/Users/user/Documents/Software-Developer/zenvix-demo/business-flow-suite-v2/src/pages/core/tools/Explorer.tsx', 'utf8');

let open = 0;
let close = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') open++;
    if (content[i] === '}') close++;
}

console.log(`Braces: { ${open}, } ${close}`);

let openTag = 0;
let closeTag = 0;
const tags = content.match(/<[a-zA-Z0-9]+/g) || [];
const closeTags = content.match(/<\/[a-zA-Z0-9]+/g) || [];

console.log(`Tags: < ${tags.length}, </ ${closeTags.length}`);
