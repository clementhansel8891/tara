import sys
import os
import re

# List of files I've refactored and likely broken
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
        print(f"Skipping {filepath}")
        return

    with open(abs_path, 'r') as f:
        content = f.read()

    # 1. Fix import paths (too many ../)
    # Check if we have ../../../../../gateway or ../../../../gateway
    # For core/modules, it should be ../../gateway or ../../../gateway
    content = content.replace('../../../../gateway', '../../../gateway')
    content = content.replace('../../../gateway', '../../gateway') # This might be too aggressive, but let's see
    
    # Actually, let's recalculate accurately
    parts = filepath.split(os.sep)
    # backend/src/core/inventory/inventory.service.ts -> ['backend', 'src', 'core', 'inventory', 'inventory.service.ts']
    # If NestJS root is backend/src:
    # core/inventory/inventory.service.ts -> depth 2 from src
    # shared/iot/repositories/iot.db.repository.ts -> depth 3 from src
    
    if "backend\\src" in abs_path:
        # Find index of 'src'
        try:
            src_index = parts.index('src')
            depth_from_src = len(parts) - 1 - src_index
            rel_path = ("../" * (depth_from_src - 1)) + "gateway/tenant-context.interface"
            # Update the import
            content = re.sub(r'import \{ TenantContext \} from "[^"]+";', f'import {{ TenantContext }} from "{rel_path}";', content)
            
            # Same for MultiTenancyUtil
            rel_utils = ("../" * (depth_from_src - 1)) + "shared/utils/multi-tenancy.util"
            content = re.sub(r'import \{ MultiTenancyUtil \} from "[^"]+";', f'import {{ MultiTenancyUtil }} from "{rel_utils}";', content)
        except ValueError:
            pass

    # 2. Fix tenant_id usage
    # If method has (ctx: TenantContext), replace standalone tenant_id with ctx.tenant_id
    # We look for methods: async method(ctx: TenantContext, ...) { ... }
    def fix_tenant_id_in_body(match):
        method_sig = match.group(1)
        method_body = match.group(2)
        # Replace tenant_id with ctx.tenant_id if it's not a property assignment or variable declaration
        # and not already ctx.tenant_id
        
        # Shorthand: tenant_id, -> ctx.tenant_id as tenant_id,
        method_body = re.sub(r'(?<!\.)\btenant_id\b\s*:', r'tenant_id: ctx.tenant_id', method_body) # Property assignment: tenant_id: ctx.tenant_id
        # Shorthand in objects: { ..., tenant_id, ... } -> { ..., tenant_id: ctx.tenant_id, ... }
        method_body = re.sub(r'(\{|,)\s*\btenant_id\b\s*(,|})', r'\1 tenant_id: ctx.tenant_id \2', method_body)
        # Standalone usage in calls: method(tenant_id) -> method(ctx.tenant_id)
        method_body = re.sub(r'(?<!\.)\btenant_id\b', r'ctx.tenant_id', method_body)
        
        return f"{method_sig}{{{method_body}}}"

    # Apply to all methods with ctx: TenantContext
    content = re.sub(r'(async \w+\(.*?ctx: TenantContext.*?\)\s*)\{([\s\S]*?)\}', fix_tenant_id_in_body, content)

    with open(abs_path, 'w') as f:
        f.write(content)
    print(f"Fixed {filepath}")

for f in files_to_fix:
    fix_file(f)
