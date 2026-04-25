import sys
import os
import re

controllers_to_refactor = [
    r"backend\src\core\inventory\inventory.controller.ts",
    r"backend\src\modules\retail\retail.controller.ts",
    r"backend\src\core\sales\sales.controller.ts",
    r"backend\src\modules\fnb\fnb.controller.ts",
    r"backend\src\modules\farming\farming.controller.ts",
]

base_dir = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2"

def refactor_controller(filepath):
    abs_path = os.path.join(base_dir, filepath)
    if not os.path.exists(abs_path):
        print(f"Skipping {filepath} (not found)")
        return

    with open(abs_path, 'r') as f:
        content = f.read()

    # 1. Identify where tenantContext is extracted
    # Usually: const { tenant_id: tenant_id } = request.tenantContext;
    # Or: const { tenant_id } = request.tenantContext;
    
    # We want to change calls from this.service.method(tenant_id, ...) to this.service.method(request.tenantContext, ...)
    # But wait, some controllers use destructuring.
    
    # Replace destructuring to include tenantContext if needed or just use request.tenantContext
    # Actually, the interceptor already attaches tenantContext to the request.
    
    # 2. Replace service calls: this.inventoryService.getDashboard(tenant_id) -> this.inventoryService.getDashboard(request.tenantContext)
    # This is complex because different services have different names.
    # I'll use a regex that looks for this.[someService].method(tenant_id
    
    # First, ensure tenant_id is available if still needed for response or local logic
    # (Existing destructuring is fine)
    
    # Replace calls
    content = content.replace('(tenant_id,', '(request.tenantContext,')
    content = content.replace('(tenant_id)', '(request.tenantContext)')

    with open(abs_path, 'w') as f:
        f.write(content)
    print(f"Refactored controller {filepath}")

for f in controllers_to_refactor:
    refactor_controller(f)
