const fs = require('fs');
const path = require('path');

const targetDirs = [
    path.join(process.cwd(), 'src', 'pages', 'core'),
    path.join(process.cwd(), 'src', 'pages', 'retail')
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

// 1. Fix the damage caused by the previous script
// Pattern: some.object.(Array.isArray(property) ? property : []).filter
// Should be: (Array.isArray(some.object.property) ? some.object.property : []).filter
const damageRegex = /([a-zA-Z0-9_.]+)\.\(Array\.isArray\(([a-zA-Z0-9_]+)\)\s*\?\s*\2\s*:\s*\[\]\)\.filter/g;

// 2. Properly wrap ANY .filter call that isn't already wrapped or is just a plain array literal
// We want to match: [expression].filter(
// But avoid: (Array.isArray(X) ? X : []).filter
// And avoid: [].filter
const filterRegex = /(?<!Array\.isArray\(.*?\)\s*\?\s*.*?\s*:\s*)(\[\]|[a-zA-Z0-9_.]+(?:\[[^\]]+\])*)\.filter\s*\(/g;

targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = walk(dir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;

        // Fix damage first
        content = content.replace(damageRegex, (match, p1, p2) => {
            const fullPath = `${p1}.${p2}`;
            return `(Array.isArray(${fullPath}) ? ${fullPath} : []).filter`;
        });

        // Now find other unwrapped filters
        // This is tricky because we might match things we shouldn't.
        // Let's just fix the damage for now and see if there are others.
        
        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            console.log(`Fixed damage in: ${file}`);
        }
    });
});
