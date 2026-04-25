import sys
import os
import re

services_to_refactor = [
    r"backend\src\core\inventory\inventory.service.ts",
    r"backend\src\modules\retail\services\retail.service.ts",
    r"backend\src\core\sales\services\sales.service.ts",
    r"backend\src\modules\fnb\services\fnb.service.ts",
    r"backend\src\modules\farming\services\farming.service.ts",
]

def refactor_service(filepath):
    abs_path = os.path.join(r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2", filepath)
    if not os.path.exists(abs_path):
        print(f"Skipping {filepath} (not found)")
        return

    with open(abs_path, 'r') as f:
        content = f.read()

    # Determine relative paths
    parts = filepath.split(os.sep)
    depth = len(parts) - 1
    rel_gateway = ("../" * (depth - 1)) + "gateway/tenant-context.interface"
    
    if "backend\\src\\modules" in filepath:
        rel_gateway = ("../" * (depth)) + "gateway/tenant-context.interface"

    # 1. Add imports if missing
    if "TenantContext" not in content:
        content = f'import {{ TenantContext }} from "{rel_gateway}";\n' + content

    # 2. Replace signatures: async method(tenant_id: string, ...) -> async method(ctx: TenantContext, ...)
    content = re.sub(r'async (\w+)\(\s*tenant_id: string,', r'async \1(ctx: TenantContext,', content)
    # Also handle single param methods
    content = re.sub(r'async (\w+)\(\s*tenant_id: string\s*\)', r'async \1(ctx: TenantContext)', content)

    # 3. Replace repository calls: this.repository.method(tenant_id, ...) -> this.repository.method(ctx, ...)
    # This is tricky because we need to know if it's a repository call.
    # Usually it's this.repository.method(tenant_id
    content = content.replace('(tenant_id,', '(ctx,')
    content = content.replace('(tenant_id)', '(ctx)')
    
    # 4. Handle auditService calls
    content = content.replace('tenant_id: tenant_id,', 'tenant_id: ctx.tenant_id,')
    
    # 5. Fix remaining tenant_id usage
    content = content.replace('tenant_id: tenant_id', 'tenant_id: ctx.tenant_id')

    with open(abs_path, 'w') as f:
        f.write(content)
    print(f"Refactored service {filepath}")

for f in services_to_refactor:
    refactor_service(f)
