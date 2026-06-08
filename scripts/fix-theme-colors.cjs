/**
 * THEME COLOR FIX SCRIPT
 * 
 * This script automatically fixes hardcoded colors in component files
 * by replacing them with theme-aware alternatives.
 * 
 * Usage: node scripts/fix-theme-colors.cjs
 */

const fs = require('fs');
const path = require('path');

// Color replacement mappings
const COLOR_MAPPINGS = [
  // Red/rose/destructive
  { pattern: /text-red-500/g, replacement: 'text-destructive' },
  { pattern: /text-red-600/g, replacement: 'text-destructive' },
  { pattern: /bg-red-500\/10/g, replacement: 'bg-destructive/10' },
  { pattern: /bg-red-500\/20/g, replacement: 'bg-destructive/20' },
  { pattern: /bg-red-900\/20/g, replacement: 'bg-destructive/20' },
  { pattern: /border-red-500/g, replacement: 'border-destructive' },
  
  // Amber/warning
  { pattern: /text-amber-500/g, replacement: 'text-warning' },
  { pattern: /text-amber-600/g, replacement: 'text-warning' },
  { pattern: /bg-amber-500\/10/g, replacement: 'bg-warning/10' },
  { pattern: /bg-amber-500\/20/g, replacement: 'bg-warning/20' },
  { pattern: /border-amber-500/g, replacement: 'border-warning' },
  
  // Emerald/green/success
  { pattern: /text-emerald-500/g, replacement: 'text-success' },
  { pattern: /text-emerald-600/g, replacement: 'text-success' },
  { pattern: /bg-emerald-500\/10/g, replacement: 'bg-success/10' },
  { pattern: /bg-emerald-600/g, replacement: 'bg-success' },
  { pattern: /bg-emerald-900\/20/g, replacement: 'bg-success/20' },
  { pattern: /border-emerald-500/g, replacement: 'border-success' },
  { pattern: /shadow-emerald-600/g, replacement: 'shadow-success' },
  
  // Green (success)
  { pattern: /text-green-500/g, replacement: 'text-success' },
  { pattern: /text-green-600/g, replacement: 'text-success' },
  { pattern: /bg-green-500\/10/g, replacement: 'bg-success/10' },
  { pattern: /bg-green-500\/20/g, replacement: 'bg-success/20' },
  { pattern: /border-green-500/g, replacement: 'border-success' },
  
  // Blue/primary/info
  { pattern: /text-blue-400/g, replacement: 'text-primary' },
  { pattern: /text-blue-500/g, replacement: 'text-primary' },
  { pattern: /bg-blue-500\/10/g, replacement: 'bg-primary/10' },
  { pattern: /bg-blue-500\/20/g, replacement: 'bg-primary/20' },
  { pattern: /border-blue-500/g, replacement: 'border-primary' },
  
  // Purple (keep for specific cases)
  { pattern: /text-purple-500/g, replacement: 'text-purple-500' },
  { pattern: /bg-purple-500\/10/g, replacement: 'bg-purple-500/10' },
  
  // Pink (keep for specific cases)
  { pattern: /text-pink-600/g, replacement: 'text-pink-600' },
  { pattern: /bg-pink-500\/10/g, replacement: 'bg-pink-500/10' },
  
  // Indigo/primary
  { pattern: /text-indigo-400/g, replacement: 'text-primary' },
  { pattern: /text-indigo-500/g, replacement: 'text-primary' },
  { pattern: /bg-indigo-500\/10/g, replacement: 'bg-primary/10' },
  { pattern: /border-indigo-500/g, replacement: 'border-primary' },
  
  // Sky/info
  { pattern: /text-sky-400/g, replacement: 'text-info' },
  { pattern: /text-sky-600/g, replacement: 'text-info' },
  { pattern: /bg-sky-400/g, replacement: 'bg-info' },
  { pattern: /bg-sky-500\/10/g, replacement: 'bg-info/10' },
  { pattern: /bg-sky-500\/20/g, replacement: 'bg-info/20' },
  { pattern: /border-sky-500/g, replacement: 'border-info' },
  
  // Orange (keep for specific cases)
  { pattern: /text-orange-500/g, replacement: 'text-orange-500' },
  { pattern: /bg-orange-500\/10/g, replacement: 'bg-orange-500/10' },
  
  // Yellow/warning
  { pattern: /text-yellow-500/g, replacement: 'text-warning' },
  { pattern: /bg-yellow-500\/10/g, replacement: 'bg-warning/10' },
  { pattern: /border-yellow-500/g, replacement: 'border-warning' },
  
  // Cyan (keep for specific cases)
  { pattern: /text-cyan-600/g, replacement: 'text-cyan-600' },
  { pattern: /bg-cyan-500\/10/g, replacement: 'bg-cyan-500/10' },
  
  // Lime (keep for specific cases)
  { pattern: /text-lime-600/g, replacement: 'text-lime-600' },
  { pattern: /bg-lime-500\/10/g, replacement: 'bg-lime-500/10' },
  
  // Rose (destructive)
  { pattern: /text-rose-400/g, replacement: 'text-destructive' },
  { pattern: /text-rose-500/g, replacement: 'text-destructive' },
  { pattern: /bg-rose-500\/10/g, replacement: 'bg-destructive/10' },
  { pattern: /border-rose-500/g, replacement: 'border-destructive' },
  
  // Gray/zinc/neutral (keep for specific cases)
  { pattern: /text-gray-500/g, replacement: 'text-muted-foreground' },
  { pattern: /text-gray-600/g, replacement: 'text-muted-foreground' },
  { pattern: /bg-gray-500\/10/g, replacement: 'bg-muted/10' },
  
  // Muted
  { pattern: /text-muted-foreground/g, replacement: 'text-muted-foreground' },
  { pattern: /bg-muted\/10/g, replacement: 'bg-muted/10' },
  { pattern: /bg-muted\/20/g, replacement: 'bg-muted/20' },
  { pattern: /border-muted/g, replacement: 'border-muted' },
  
  // Success
  { pattern: /text-success/g, replacement: 'text-success' },
  { pattern: /bg-success\/10/g, replacement: 'bg-success/10' },
  { pattern: /bg-success\/20/g, replacement: 'bg-success/20' },
  { pattern: /border-success/g, replacement: 'border-success' },
  
  // Warning
  { pattern: /text-warning/g, replacement: 'text-warning' },
  { pattern: /bg-warning\/10/g, replacement: 'bg-warning/10' },
  { pattern: /bg-warning\/20/g, replacement: 'bg-warning/20' },
  { pattern: /border-warning/g, replacement: 'border-warning' },
  
  // Destructive
  { pattern: /text-destructive/g, replacement: 'text-destructive' },
  { pattern: /bg-destructive\/10/g, replacement: 'bg-destructive/10' },
  { pattern: /bg-destructive\/20/g, replacement: 'bg-destructive/20' },
  { pattern: /border-destructive/g, replacement: 'border-destructive' },
  
  // Info
  { pattern: /text-info/g, replacement: 'text-info' },
  { pattern: /bg-info\/10/g, replacement: 'bg-info/10' },
  { pattern: /bg-info\/20/g, replacement: 'bg-info/20' },
  { pattern: /border-info/g, replacement: 'border-info' },
  
  // Primary
  { pattern: /text-primary/g, replacement: 'text-primary' },
  { pattern: /bg-primary\/10/g, replacement: 'bg-primary/10' },
  { pattern: /bg-primary\/20/g, replacement: 'bg-primary/20' },
  { pattern: /bg-primary\/50/g, replacement: 'bg-primary/50' },
  { pattern: /border-primary/g, replacement: 'border-primary' },
  
  // Background
  { pattern: /bg-background/g, replacement: 'bg-background' },
  { pattern: /text-foreground/g, replacement: 'text-foreground' },
  { pattern: /border-border/g, replacement: 'border-border' },
];

// Files to process (relative to workspace root)
const FILES_TO_PROCESS = [
  'src/pages/retail/management/DeviceControlCenter.tsx',
  'src/pages/retail/management/DeveloperConsole.tsx',
  'src/pages/retail/operational/OperationalGateway.tsx',
  'src/pages/retail/operational/pos/Cashier.tsx',
  'src/pages/retail/operational/RefundReturnDesk.tsx',
  'src/pages/retail/management/EcommerceAnalytics.tsx',
  'src/pages/retail/operational/SelfServiceKiosk.tsx',
  'src/pages/fnb/Cashier.tsx',
  'src/pages/fnb/Inventory.tsx',
  'src/pages/industry/farming/FarmDesk.tsx',
  'src/pages/core/inventory/InventoryAdjustments.tsx',
  'src/pages/retail/management/command-center/GlobalKpiRow.tsx',
  'src/pages/retail/management/command-center/InfrastructureHealth.tsx',
];

function fixColorsInFile(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${fullPath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  let changes = 0;
  
  // Apply all color mappings
  for (const mapping of COLOR_MAPPINGS) {
    const matches = content.match(mapping.pattern);
    if (matches) {
      content = content.replace(mapping.pattern, mapping.replacement);
      changes += matches.length;
    }
  }
  
  // Write back if changes were made
  if (changes > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${changes} colors in: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  No changes needed for: ${filePath}`);
    return false;
  }
}

function main() {
  console.log('🔍 Starting theme color fix script...\n');
  
  let totalFiles = 0;
  let totalChanges = 0;
  let filesChanged = 0;
  
  for (const filePath of FILES_TO_PROCESS) {
    totalFiles++;
    const changed = fixColorsInFile(filePath);
    if (changed) {
      filesChanged++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Total files checked: ${totalFiles}`);
  console.log(`   Files changed: ${filesChanged}`);
  console.log(`   Total replacements: ${totalChanges}`);
  console.log('='.repeat(60));
  console.log('\n✅ Theme color fix complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review the changes in each file');
  console.log('   2. Test in both light and dark modes');
  console.log('   3. Update any remaining hardcoded colors manually');
  console.log('   4. Use the new theme-aware components for future development');
}

main();
