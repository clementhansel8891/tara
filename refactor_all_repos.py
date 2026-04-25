import sys
import os
import re

files_to_refactor = [
    r"backend\src\core\inventory\repositories\inventory.db.repository.ts",
    r"backend\src\modules\retail\repositories\retail.db.repository.ts",
    r"backend\src\core\sales\repositories\sales.db.repository.ts",
    r"backend\src\modules\fnb\repositories\fnb.db.repository.ts",
    r"backend\src\modules\farming\repositories\farming.db.repository.ts",
]

def refactor_file(filepath):
    abs_path = os.path.join(r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2", filepath)
    if not os.path.exists(abs_path):
        print(f"Skipping {filepath} (not found)")
        return

    with open(abs_path, 'r') as f:
        content = f.read()

    # 1. Add imports if missing
    if "TenantContext" not in content:
        content = content.replace('import { Injectable }', 'import { TenantContext } from "../../../gateway/tenant-context.interface";\nimport { MultiTenancyUtil } from "../../../shared/utils/multi-tenancy.util";\nimport { Injectable }')
        # Adjust import path based on depth
        if "backend\\src\\modules" in filepath:
             content = content.replace('../../../gateway', '../../../../gateway')
             content = content.replace('../../../shared', '../../../../shared')

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
