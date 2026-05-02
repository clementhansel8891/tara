const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'src');

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

// Multiline regex to find unwrapped .filter() or .map() calls
// Group 1: The optional chaining or dot
// Group 2: The expression before the method
// Group 3: The method name (filter or map)
// [\s\S]*? handles potential newlines between expression and method
const findRegex = /(?<!Array\.isArray\(.*?\)\s*\?\s*.*?\s*:\s*|\[\]|[a-zA-Z0-9_.]+\s*)([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+|\[[^\]]+\])*)\s*(\?\.|\.)(filter|map)\s*\(/g;

const files = walk(targetDir);
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    content = content.replace(findRegex, (match, expr, op, method) => {
        if (expr === 'Array') return match;
        if (['Object', 'JSON', 'Math', 'console', 'fs', 'path'].includes(expr)) return match;
        
        // Check if the previous char is a dot (chained call)
        // match starts at index p in content
        // We need the index... 
        return `(Array.isArray(${expr}) ? ${expr} : []).${method}(`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`Patched: ${file}`);
    }
});
