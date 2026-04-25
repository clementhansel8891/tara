import sys
import os
import re

interfaces_to_refactor = [
    r"backend\src\shared\iot\repositories\iot.repository.interface.ts",
    r"backend\src\core\it-settings\repositories\it-settings.repository.interface.ts",
    r"backend\src\core\auth\repositories\auth.repository.interface.ts",
    r"backend\src\core\auth\repositories\provisioning.repository.interface.ts",
    r"backend\src\core\marketing\repositories\marketing.repository.interface.ts",
    r"backend\src\core\payment\repositories\payment.repository.interface.ts",
    r"backend\src\core\pricing\repositories\interfaces\pricing.repository.interface.ts",
    r"backend\src\core\procurement\repositories\procurement.repository.interface.ts",
]

def refactor_interface(filepath):
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

    # 1. Add imports if missing
    if "TenantContext" not in content:
        content = f'import {{ TenantContext }} from "{rel_gateway}";\n' + content

    # 2. Replace signatures: (tenant_id: string, ...) -> (ctx: TenantContext, ...)
    content = re.sub(r'(\(|,)\s*tenant_id: string', r'\1 ctx: TenantContext', content)

    with open(abs_path, 'w') as f:
        f.write(content)
    print(f"Refactored interface {filepath}")

for f in interfaces_to_refactor:
    refactor_interface(f)
