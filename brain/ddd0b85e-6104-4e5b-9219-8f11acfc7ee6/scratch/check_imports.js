import fs from 'fs';
import path from 'path';

function findFiles(dir, ext) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(file, ext));
        } else if (file.endsWith(ext)) {
            results.push(file);
        }
    });
    return results;
}

const files = findFiles('src', '.tsx');
const suspiciousFiles = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const hasButton = content.includes('<Button');
    const hasBadge = content.includes('<Badge');
    const importsButton = content.includes('import { Button }') || content.includes('import {Button}');
    const importsBadge = content.includes('import { Badge }') || content.includes('import {Badge}');

    if (hasButton && !importsButton) {
        suspiciousFiles.push({ file, missing: 'Button' });
    }
    if (hasBadge && !importsBadge) {
        suspiciousFiles.push({ file, missing: 'Badge' });
    }
});

console.log(JSON.stringify(suspiciousFiles, null, 2));
