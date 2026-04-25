import sys
import re

filepath = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2\prisma\schema.prisma"

with open(filepath, 'r') as f:
    content = f.read()

def add_multi_tenancy_to_unique(match):
    original = match.group(0)
    fields = match.group(1)
    
    # If it already has tenant_id or is a model that shouldn't have it (tenants, companies)
    # Actually, we want to add it to almost everything.
    
    if "tenant_id" in fields:
        return original
        
    # We want to insert tenant_id, company_id at the beginning
    new_fields = f"tenant_id, company_id, {fields}"
    return f"@@unique([{new_fields}])"

# Match @@unique([field1, field2, ...])
new_content = re.sub(r'@@unique\(\[([^\]]+)\]\)', add_multi_tenancy_to_unique, content)

# Special case for stock_levels since it was failing in my previous attempt
# it had a name for the unique index in the code (location_id_product_id_department_id)
# Prisma usually generates this automatically if not specified.

with open(filepath, 'w') as f:
    f.write(new_content)

print("Updated unique indexes in schema.prisma")
