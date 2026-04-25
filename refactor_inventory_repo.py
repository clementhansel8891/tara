import sys
import os
import re

filepath = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2\backend\src\core\inventory\repositories\inventory.db.repository.ts"

with open(filepath, 'r') as f:
    content = f.read()

# Replace signatures
content = re.sub(r'async (\w+)\(\s*tenant_id: string,', r'async \1(ctx: TenantContext,', content)

# Replace simple where clauses
content = content.replace('where: { tenant_id: tenant_id }', 'where: MultiTenancyUtil.getScope(ctx)')
content = content.replace('where: { tenant_id: tenant_id,', 'where: { ...MultiTenancyUtil.getScope(ctx),')

# Replace create data
# This is tricky because wrapCreate needs the whole object.
# I'll do a simpler replacement for now and fix manually if needed.
content = content.replace('tenant_id: tenant_id,', '...MultiTenancyUtil.getScope(ctx),')

# Fix upsert where
# location_id_product_id_department_id: { ... }
# We might need to include tenant_id/company_id if we update the index.

with open(filepath, 'w') as f:
    f.write(content)

print("Refactored InventoryDbRepository")
