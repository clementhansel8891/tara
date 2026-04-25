import sys
import re

filepath = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2\prisma\schema.prisma"

with open(filepath, 'r') as f:
    content = f.read()

# 1. Find all model names
model_names = set(re.findall(r'model (\w+) \{', content))

# 2. Find all types used in fields
# Matches: field_name Type or field_name Type[] or field_name Type?
# Excludes built-in types: String, Int, Float, Boolean, DateTime, Decimal, Json, Bytes, BigInt
builtin_types = {"String", "Int", "Float", "Boolean", "DateTime", "Decimal", "Json", "Bytes", "BigInt"}

used_types = set()
# Look inside models
models = re.findall(r'model \w+ \{([\s\S]*?)\}', content)
for body in models:
    lines = body.split('\n')
    for line in lines:
        line = line.strip()
        if not line or line.startswith('@@') or line.startswith('//'):
            continue
        parts = line.split()
        if len(parts) >= 2:
            type_name = parts[1].replace('[]', '').replace('?', '')
            if type_name not in builtin_types:
                used_types.add(type_name)

# 3. Find missing types
missing_types = used_types - model_names

print(f"Missing types: {missing_types}")

# 4. Try to map missing types to model names using snake_case and pluralization
def to_snake(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def to_plural(name):
    if name.endswith('s'): return name
    if name.endswith('y'): return name[:-1] + 'ies'
    return name + 's'

mapping = {}
for mt in missing_types:
    snake = to_snake(mt)
    plural_snake = to_plural(snake)
    if plural_snake in model_names:
        mapping[mt] = plural_snake
    elif snake in model_names:
        mapping[mt] = snake
    else:
        # Try some manual/common variations
        if mt.endswith('Status') and to_plural(to_snake(mt)) in model_names:
             mapping[mt] = to_plural(to_snake(mt))

print(f"Mapping: {mapping}")

# 5. Apply mapping
for old, new in mapping.items():
    content = re.sub(fr'\b{old}\b', new, content)

with open(filepath, 'w') as f:
    f.write(content)

print("Applied automated relation type fixes")
