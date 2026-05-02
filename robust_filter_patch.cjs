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

// Regex to find unwrapped .filter() calls
// Group 1: The expression before .filter
// We exclude cases where it's already wrapped or is an array literal []
// We also exclude cases where it's preceded by a dot (e.g. .map(...).filter(...))
const filterRegex = /(?<!\?|:|\(|Array\.isArray\(.*?\)\s*\?\s*.*?\s*:\s*|\[\]|[a-zA-Z0-9_.]+\s*)\b([a-zA-Z0-9_.]+(?:\[[^\]]+\])*)\.filter\s*\(/g;

// Actually, let's use a simpler approach:
// Match any EXPRESSION.filter( where EXPRESSION is:
// - A variable name: data.filter
// - A property access: this.items.filter
// - A bracket access: state[key].filter
// AND it is NOT preceded by (Array.isArray(...) ? ... : [])

targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = walk(dir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;

        // Better Regex:
        // Match: [Something].filter(
        // Avoid: .filter( (chained)
        // Avoid: [].filter( (literal)
        // Avoid: (Array.isArray(X) ? X : []).filter( (already patched)
        
        // This regex matches things like 'data.filter(' or 'state.items.filter(' or 'items[0].filter('
        // but avoids '.filter(' (starts with dot)
        const findRegex = /(?<!\.)\b([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+|\[[^\]]+\])*)\.filter\s*\(/g;
        
        content = content.replace(findRegex, (match, expr) => {
            // Check if expr is 'Array' (as in Array.isArray) - skip
            if (expr === 'Array') return match;
            // Check if it's already inside our pattern (this is hard with regex, but we can check if the line contains Array.isArray)
            // Actually, the findRegex (negative lookbehind for dot) already helps a lot.
            // Let's also check if it's already wrapped by checking the prefix in the source
            return `(Array.isArray(${expr}) ? ${expr} : []).filter(`;
        });

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            console.log(`Patched: ${file}`);
        }
    });
});
