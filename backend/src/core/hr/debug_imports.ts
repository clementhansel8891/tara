
import * as fs from 'fs';
import * as path from 'path';

function checkFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = content.match(/import {?([^}]*)}? from ['"]([^'"]*)['"]/g) || [];
    
    console.log(`Checking ${filePath}...`);
    imports.forEach(imp => {
        if (imp.includes('./') || imp.includes('../')) {
            console.log(`  Local import: ${imp}`);
        }
    });
}

// Check HRModule and its immediate dependencies
const baseDir = 'backend/src/core/hr';
checkFile(path.join(baseDir, 'hr.module.ts'));
