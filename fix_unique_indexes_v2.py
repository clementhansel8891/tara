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
    
    # Check if model has tenant_id
    if "tenant_id" in model_body:
        # Fix @@unique in this model
        # Remove the previous failed attempt if it added tenant_id twice or where it shouldn't
        # Actually, I'll just find @@unique and ensure it has tenant_id, company_id if missing
        
        def fix_unique(match):
            fields = match.group(1)
            if "tenant_id" in fields:
                return match.group(0)
            return f"@@unique([tenant_id, company_id, {fields}])"
            
        model_body = re.sub(r'@@unique\(\[([^\]]+)\]\)', fix_unique, model_body)
    else:
        # If model DOES NOT have tenant_id, REMOVE tenant_id, company_id from @@unique if I added it
        model_body = model_body.replace("tenant_id, company_id, ", "")

    new_content_parts.append(model_header)
    new_content_parts.append(model_body)

new_content = "".join(new_content_parts)

with open(filepath, 'w') as f:
    f.write(new_content)

print("Fixed unique indexes in schema.prisma (selective)")
