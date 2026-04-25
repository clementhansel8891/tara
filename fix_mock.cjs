const fs = require('fs');
const file = 'backend/src/core/finance/repositories/finance.mock.repository.ts';
let code = fs.readFileSync(file, 'utf8');

// Add import TenantContext
if (!code.includes('import { TenantContext }')) {
  code = code.replace(
    'import { IFinanceRepository } from "./finance.repository.interface";',
    'import { IFinanceRepository } from "./finance.repository.interface";\nimport { TenantContext } from "../../../gateway/tenant-context.interface";'
  );
}

// Regex to replace method signatures
const regex = /async (\w+)\(\s*tenant_id:\s*string(,\s*[^)]*)?\): Promise<([^>]+)>/g;
code = code.replace(regex, (match, method, args, returnType) => {
  return `async ${method}(ctx: TenantContext${args || ''}): Promise<${returnType}>`;
});

const blockRegex = /async (\w+)\(ctx:\s*TenantContext(,\s*[^)]*)?\):\s*Promise<([^>]+)>\s*\{/g;
code = code.replace(blockRegex, (match) => {
  return match + '\n    const tenant_id = ctx.tenant_id;';
});

fs.writeFileSync(file, code);
