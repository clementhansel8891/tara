import os
import re

affected_files = [
    r"backend\src\core\inventory\inventory.service.ts",
    r"backend\src\core\marketing\marketing.service.ts",
    r"backend\src\core\procurement\procurement.service.ts",
    r"backend\src\core\sales\sales.service.ts",
    r"backend\src\modules\retail\retail.service.ts",
]

base_dir = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2"

def fix_syntax_errors(filepath):
    abs_path = os.path.join(base_dir, filepath)
    if not os.path.exists(abs_path):
        print(f"Skipping {filepath}")
        return

    with open(abs_path, 'r') as f:
        content = f.read()

    # 1. Fix the most broken pattern: ctx.tenant_id: ctx.tenant_id ctx.tenant_id
    content = content.replace('ctx.tenant_id: ctx.tenant_id ctx.tenant_id', 'tenant_id: ctx.tenant_id')
    
    # 2. Fix patterns like ctx.tenant_id: ctx.tenant_id
    content = content.replace('ctx.tenant_id: ctx.tenant_id', 'tenant_id: ctx.tenant_id')
    
    # 3. Fix patterns like tenant_id: ctx.tenant_id ctx.tenant_id
    content = content.replace('tenant_id: ctx.tenant_id ctx.tenant_id', 'tenant_id: ctx.tenant_id')

    # 4. Fix any standalone ctx.tenant_id that might have been doubled
    content = content.replace('ctx.tenant_id ctx.tenant_id', 'ctx.tenant_id')

    # 5. Fix possible triple doubling
    content = content.replace('ctx.tenant_id ctx.tenant_id ctx.tenant_id', 'ctx.tenant_id')

    with open(abs_path, 'w') as f:
        f.write(content)
    print(f"Fixed syntax errors in {filepath}")

for f in affected_files:
    fix_syntax_errors(f)
