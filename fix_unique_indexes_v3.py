import sys
import re

filepath = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2\prisma\schema.prisma"

with open(filepath, 'r') as f:
    content = f.read()

# Split by models
models = re.split(r'(model \w+ \{)', content)

new_content_parts = [models[0]]

for i in range(1, len(models), 2):
    model_header = models[i]
    model_body = models[i+1]
    
    # Check if model has tenant_id as a FIELD
    has_tenant_field = re.search(r'^\s+tenant_id\s+String', model_body, re.MULTILINE)
    
    if has_tenant_field:
        # Fix @@unique in this model
        def fix_unique(match):
            fields_str = match.group(1)
            # Split fields, clean whitespace
            fields = [f.strip() for f in fields_str.split(",")]
            
            # Remove tenant_id and company_id if they exist anywhere else in the list to avoid duplicates
            fields = [f for f in fields if f not in ["tenant_id", "company_id"]]
            
            # Add them to the beginning
            new_fields = ["tenant_id", "company_id"] + fields
            return f"@@unique([{', '.join(new_fields)}])"
            
        model_body = re.sub(r'@@unique\(\[([^\]]+)\]\)', fix_unique, model_body)
    else:
        # Remove tenant_id, company_id from @@unique if it shouldn't be there
        model_body = model_body.replace("tenant_id, company_id, ", "")

    new_content_parts.append(model_header)
    new_content_parts.append(model_body)

new_content = "".join(new_content_parts)

with open(filepath, 'w') as f:
    f.write(new_content)

print("Fixed unique indexes in schema.prisma (selective v3)")
