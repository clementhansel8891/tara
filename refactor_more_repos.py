import sys
import os
import re

files_to_refactor = [
    r"backend\src\shared\iot\repositories\iot.db.repository.ts",
    r"backend\src\core\it-settings\repositories\it-settings.db.repository.ts",
    r"backend\src\core\auth\repositories\auth.db.repository.ts",
    r"backend\src\core\auth\repositories\provisioning.db.repository.ts",
    r"backend\src\core\marketing\repositories\marketing.db.repository.ts",
    r"backend\src\core\payment\repositories\payment.db.repository.ts",
    r"backend\src\core\pricing\repositories\pricing.db.repository.ts",
    r"backend\src\core\procurement\repositories\procurement.db.repository.ts",
]

def refactor_file(filepath):
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
    rel_utils = ("../" * (depth - 1)) + "shared/utils/multi-tenancy.util"

    if "backend\\src\\modules" in filepath:
        rel_gateway = ("../" * (depth)) + "gateway/tenant-context.interface"
        rel_utils = ("../" * (depth)) + "shared/utils/multi-tenancy.util"

    # 1. Add imports if missing
    if "TenantContext" not in content:
        import_line = f'import {{ TenantContext }} from "{rel_gateway}";\nimport {{ MultiTenancyUtil }} from "{rel_utils}";\n'
        if 'import { Injectable' in content:
            content = content.replace('import { Injectable', import_line + 'import { Injectable')
        else:
            content = import_line + content

    # 2. Replace signatures: async method(tenant_id: string, ...) -> async method(ctx: TenantContext, ...)
    content = re.sub(r'async (\w+)\(\s*tenant_id: string,', r'async \1(ctx: TenantContext,', content)

    # 3. Replace where clauses
    content = content.replace('where: { tenant_id: tenant_id }', 'where: MultiTenancyUtil.getScope(ctx)')
    content = content.replace('where: { tenant_id: tenant_id,', 'where: { ...MultiTenancyUtil.getScope(ctx),')

    # 4. Replace create data
    content = content.replace('tenant_id: tenant_id,', '...MultiTenancyUtil.getScope(ctx),')
    
    # 5. Fix common return types or other tenant_id usage
    content = content.replace('tenant_id: tenant_id', 'tenant_id: ctx.tenant_id')

    with open(abs_path, 'w') as f:
        f.write(content)
    print(f"Refactored {filepath}")

for f in files_to_refactor:
    refactor_file(f)
