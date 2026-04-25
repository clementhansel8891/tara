import sys
import os
import re

services_to_refactor = [
    r"backend\src\core\inventory\inventory.service.ts",
    r"backend\src\modules\retail\retail.service.ts",
    r"backend\src\core\sales\sales.service.ts",
    r"backend\src\modules\fnb\fnb.service.ts",
    r"backend\src\modules\farming\farming.service.ts",
    r"backend\src\core\procurement\procurement.service.ts",
    r"backend\src\core\pricing\pricing-engine.service.ts",
    r"backend\src\core\payment\payment.service.ts",
    r"backend\src\core\marketing\marketing.service.ts",
    r"backend\src\core\it-settings\it-settings.service.ts",
]

base_dir = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2"

def refactor_service(filepath):
    abs_path = os.path.join(base_dir, filepath)
    if not os.path.exists(abs_path):
        print(f"Skipping {filepath} (not found)")
        return

    with open(abs_path, 'r') as f:
        content = f.read()

    # Determine depth to gateway
    parts = filepath.split(os.sep)
    depth = len(parts) - 1 # e.g. backend/src/core/inventory/inventory.service.ts -> 4
    # gateway is at backend/src/gateway/tenant-context.interface.ts
    # from core/inventory to gateway: ../../gateway/tenant-context.interface
    # Depth of gateway is 2 (backend/src/gateway)
    # Relative path depth is (depth - 2)
    rel_gateway = ("../" * (depth - 2)) + "gateway/tenant-context.interface"

    # 1. Add imports if missing
    if "TenantContext" not in content:
        import_line = f'import {{ TenantContext }} from "{rel_gateway}";\n'
        if 'import { Injectable' in content:
            content = content.replace('import { Injectable', import_line + 'import { Injectable')
        else:
            content = import_line + content

    # 2. Replace signatures: async method(tenant_id: string, ...) -> async method(ctx: TenantContext, ...)
    # Look for tenant_id: string as first param
    content = re.sub(r'async (\w+)\(\s*tenant_id: string,', r'async \1(ctx: TenantContext,', content)
    content = re.sub(r'async (\w+)\(\s*tenant_id: string\s*\)', r'async \1(ctx: TenantContext)', content)

    # 3. Replace repository calls: this.repository.method(tenant_id, ...) -> this.repository.method(ctx, ...)
    # Note: Using generic replacements for tenant_id as first argument in calls
    content = content.replace('(tenant_id,', '(ctx,')
    content = content.replace('(tenant_id)', '(ctx)')
    
    # 4. Handle auditService calls and other data objects
    content = content.replace('tenant_id: tenant_id,', 'tenant_id: ctx.tenant_id,')
    
    # 5. Fix remaining tenant_id usage
    content = content.replace('tenant_id: tenant_id', 'tenant_id: ctx.tenant_id')

    with open(abs_path, 'w') as f:
        f.write(content)
    print(f"Refactored service {filepath}")

for f in services_to_refactor:
    refactor_service(f)
