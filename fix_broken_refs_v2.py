import sys
import os
import re

files_to_fix = [
    r"backend\src\core\inventory\repositories\inventory.db.repository.ts",
    r"backend\src\modules\retail\repositories\retail.db.repository.ts",
    r"backend\src\core\sales\repositories\sales.db.repository.ts",
    r"backend\src\modules\fnb\repositories\fnb.db.repository.ts",
    r"backend\src\modules\farming\repositories\farming.db.repository.ts",
    r"backend\src\shared\iot\repositories\iot.db.repository.ts",
    r"backend\src\core\it-settings\repositories\it-settings.db.repository.ts",
    r"backend\src\core\auth\repositories\auth.db.repository.ts",
    r"backend\src\core\auth\repositories\provisioning.db.repository.ts",
    r"backend\src\core\marketing\repositories\marketing.db.repository.ts",
    r"backend\src\core\payment\repositories\payment.db.repository.ts",
    r"backend\src\core\pricing\repositories\pricing.db.repository.ts",
    r"backend\src\core\procurement\repositories\procurement.db.repository.ts",
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

def fix_file(filepath):
    abs_path = os.path.join(base_dir, filepath)
    if not os.path.exists(abs_path):
        return

    with open(abs_path, 'r') as f:
        content = f.read()

    # 1. Correct import paths
    # Gateway is at backend/src/gateway/tenant-context.interface.ts
    # Utils is at backend/src/shared/utils/multi-tenancy.util.ts
    parts = filepath.split(os.sep)
    src_index = parts.index('src') if 'src' in parts else 1
    depth_from_src = len(parts) - 1 - src_index
    
    rel_gateway = ("../" * (depth_from_src - 1)) + "gateway/tenant-context.interface"
    rel_utils = ("../" * (depth_from_src - 1)) + "shared/utils/multi-tenancy.util"

    content = re.sub(r'import \{ TenantContext \} from "[^"]+";', f'import {{ TenantContext }} from "{rel_gateway}";', content)
    content = re.sub(r'import \{ MultiTenancyUtil \} from "[^"]+";', f'import {{ MultiTenancyUtil }} from "{rel_utils}";', content)

    # 2. Fix all methods that use ctx: TenantContext
    def fix_method_content(match):
        method_sig = match.group(1)
        body = match.group(2)
        
        # Replace shorthand tenant_id, with ...MultiTenancyUtil.getScope(ctx),
        # ONLY inside data: { ... } or where: { ... }
        body = re.sub(r'(data|where):\s*\{\s*\.\.\.scope,', r'\1: { ...MultiTenancyUtil.getScope(ctx),', body)
        body = re.sub(r'(data|where):\s*\{\s*tenant_id,', r'\1: { ...MultiTenancyUtil.getScope(ctx),', body)
        
        # Replace where: { tenant_id } with where: MultiTenancyUtil.getScope(ctx)
        body = re.sub(r'where:\s*\{\s*tenant_id\s*\}', r'where: MultiTenancyUtil.getScope(ctx)', body)
        
        # Replace remaining standalone tenant_id with ctx.tenant_id
        # Avoid replacing property names or already qualified ctx.tenant_id
        body = re.sub(r'(?<!\w|\.)tenant_id(?!\w|:)', 'ctx.tenant_id', body)
        
        # Fix property assignments in objects: tenant_id: tenant_id -> tenant_id: ctx.tenant_id
        body = re.sub(r'tenant_id:\s*tenant_id', 'tenant_id: ctx.tenant_id', body)
        
        return f"{method_sig}{{{body}}}"

    content = re.sub(r'(async \w+\(.*?ctx: TenantContext.*?\)\s*)\{([\s\S]*?)\}', fix_method_content, content)
    # Also for normal methods (not async)
    content = re.sub(r'(\s+\w+\(.*?ctx: TenantContext.*?\)\s*)\{([\s\S]*?)\}', fix_method_content, content)

    with open(abs_path, 'w') as f:
        f.write(content)
    print(f"Refixed {filepath}")

for f in files_to_fix:
    fix_file(f)
