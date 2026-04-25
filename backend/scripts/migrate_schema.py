import re
import os

SCHEMA_PATH = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2\prisma\schema.prisma"
OUTPUT_PATH = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2\prisma\schema.prisma.new"

def migrate_schema():
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    all_models = []
    for line in lines:
        match = re.match(r'^model\s+(\w+)\s+\{', line)
        if match: all_models.append(match.group(1))

    new_lines = []
    current_model = None
    model_body = []
    models_with_tenant = []

    def process_model(name, body):
        if name == 'tenant': return body
        body_text = "".join(body)
        
        if name == 'company':
            new_body = []
            if 'tenant_id' not in body_text:
                for line in body:
                    new_body.append(line)
                    if '@id' in line:
                        new_body.append('  tenant_id String\n')
            else: new_body = body
            
            if 'tenant tenant' not in "".join(new_body):
                if new_body and new_body[-1].strip() == '}':
                    new_body.insert(-1, '  tenant tenant @relation(fields: [tenant_id], references: [id])\n')
                else:
                    new_body.append('  tenant tenant @relation(fields: [tenant_id], references: [id])\n')
            return new_body

        if 'tenant_id' in body_text and ('company_id' not in body_text and 'companyId' not in body_text):
            new_body = []
            for line in body:
                new_body.append(line)
                if re.search(r'tenant_id\s+String', line):
                    new_body.append(line.replace('tenant_id', 'company_id'))
            body = new_body
            body_text = "".join(body)

        comp_match = re.search(r'\b(company_id|companyId)\s+String(\??)', body_text)
        comp_field = comp_match.group(1) if comp_match else 'company_id'
        is_comp_opt = (comp_match and '?' in comp_match.group(2)) or False
        ten_match = re.search(r'\btenant_id\s+String(\??)', body_text)
        is_ten_opt = (ten_match and '?' in ten_match.group(1)) or False

        new_body = []
        for line in body:
            if re.search(r'\bcompany\s+company\??\s+@relation', line):
                line = re.sub(r'fields:\s*\[(tenant_id|company_id|companyId)\]', f'fields: [{comp_field}]', line)
                if is_comp_opt:
                    if 'company?' not in line: line = re.sub(r'\bcompany\s+company\b', 'company company?', line)
                else: line = re.sub(r'\bcompany\s+company\?', 'company company', line)
            if '@@index([tenant_id])' in line:
                new_body.append(line)
                if f'@@index([{comp_field}])' not in body_text: new_body.append(line.replace('tenant_id', comp_field))
                continue
            if '@@unique' in line and 'tenant_id' in line:
                fields_match = re.search(r'@@unique\(\[(.*?)\]\)', line)
                if fields_match:
                    fields = [f.strip() for f in fields_match.group(1).split(',')]
                    new_fields = []
                    for f in fields:
                        if f not in new_fields: new_fields.append(f)
                    if comp_field not in new_fields:
                        if 'tenant_id' in new_fields:
                            idx = new_fields.index('tenant_id')
                            new_fields.insert(idx + 1, comp_field)
                        else: new_fields.insert(0, comp_field)
                    line = f'  @@unique([{", ".join(new_fields)}])\n'
            new_body.append(line)
        body = new_body
        body_text = "".join(body)

        if 'tenant_id' in body_text:
            models_with_tenant.append(name)
            if 'tenant tenant' not in body_text:
                suffix = '?' if is_ten_opt else ''
                rel_line = f'  tenant tenant{suffix} @relation(fields: [tenant_id], references: [id])\n'
                if body and body[-1].strip() == '}': body.insert(-1, rel_line)
                else: body.append(rel_line)

        retail_related = any(kw in name.lower() for kw in ['retail', 'order', 'cart', 'customer', 'promotion', 'ecommerce'])
        if retail_related and 'ecommerce_id' not in "".join(body):
            new_body = []
            added = False
            for line in body:
                new_body.append(line)
                if 'tenant_id' in line and 'String' in line and not added:
                    new_body.append(line.replace('tenant_id', 'ecommerce_id').replace('String', 'String?'))
                    added = True
            body = new_body
        return body

    for line in lines:
        match = re.match(r'^model\s+(\w+)\s+\{', line)
        if match:
            current_model = match.group(1)
            model_body = [line]
        elif current_model:
            model_body.append(line)
            if line.strip() == '}':
                new_lines.extend(process_model(current_model, model_body))
                current_model = None
                model_body = []
        else:
            new_lines.append(line)

    final_lines = []
    skip = False
    for line in new_lines:
        if line.strip() == 'model tenant {': skip = True
        if not skip: final_lines.append(line)
        if skip and line.strip() == '}': skip = False
    
    ds_end = -1
    for i, line in enumerate(final_lines):
        if line.strip() == 'datasource db {':
            for j in range(i, len(final_lines)):
                if final_lines[j].strip() == '}': ds_end = j; break
            break
    
    if ds_end != -1:
        tenant_model = ['\nmodel tenant {\n', '  id String @id\n', '  name String\n', '  code String @unique\n', '  status String @default("active")\n', '  created_at DateTime @default(now())\n', '  updated_at DateTime @default(now())\n', '  deleted_at DateTime?\n', '  company company[]\n', '  user user[]\n']
        for m in sorted(list(set(models_with_tenant))):
            if m not in ['tenant', 'company', 'user']:
                tenant_model.append(f'  {m} {m}[]\n')
        tenant_model.append('  @@map("tenants")\n}\n')
        final_lines[ds_end+1:ds_end+1] = tenant_model

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)

if __name__ == "__main__":
    migrate_schema()
    print(f"Successfully migrated schema to {OUTPUT_PATH}")
