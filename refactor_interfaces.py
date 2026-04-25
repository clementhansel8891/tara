import sys
import os
import re

interfaces_to_refactor = [
    r"backend\src\core\inventory\repositories\inventory.repository.interface.ts",
    r"backend\src\modules\retail\repositories\retail.repository.interface.ts",
    r"backend\src\core\sales\repositories\sales.repository.interface.ts",
    r"backend\src\modules\fnb\repositories\fnb.repository.interface.ts",
    r"backend\src\modules\farming\repositories\farming.repository.ts", # Farming uses the interface in the same file or different
]

def refactor_interface(filepath):
    abs_path = os.path.join(r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2", filepath)
    if not os.path.exists(abs_path):
        print(f"Skipping {filepath} (not found)")
        return

    with open(abs_path, 'r') as f:
        content = f.read()

    # 1. Add imports if missing
    if "TenantContext" not in content:
        content = 'import { TenantContext } from "../../../gateway/tenant-context.interface";\n' + content
        # Adjust import path based on depth
        if "backend\\src\\modules" in filepath:
             content = content.replace('../../../gateway', '../../../../gateway')

    # 2. Replace signatures: (tenant_id: string, ...) -> (ctx: TenantContext, ...)
    # Both abstract and non-abstract
    content = re.sub(r'(\(|,)\s*tenant_id: string', r'\1 ctx: TenantContext', content)

    with open(abs_path, 'w') as f:
        f.write(content)
    print(f"Refactored interface {filepath}")

for f in interfaces_to_refactor:
    refactor_interface(f)
