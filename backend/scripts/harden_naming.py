import re
import os

SCHEMA_PATH = r"prisma\schema.prisma"

def harden_naming_final():
    with open(SCHEMA_PATH, 'r') as f:
        content = f.read()

    # 1. Identify all models and their DESIRED names from comments
    model_blocks = re.split(r'\nmodel\s+', content)
    header = model_blocks[0]
    
    name_map = {}
    for block in model_blocks[1:]:
        lines = block.split('\n')
        current_name = lines[0].split()[0] # The name is the first word after 'model '
        
        map_match = re.search(r'// @@map\("(.*?)"\) - standardized', block)
        if map_match:
            desired_name = map_match.group(1)
            name_map[current_name] = desired_name
            # If the current name is already the desired name, we still keep it in map for type replacement

    print(f"Aligning types for {len(name_map)} models...")

    # 2. Update all type references
    # We'll use a regex that looks for indented fields
    # Format: "  fieldName TypeName  @..."
    # We'll also handle "fieldName TypeName[]" and "fieldName TypeName?"
    
    new_content = content
    for old_type, new_type in name_map.items():
        if old_type == new_type: continue
        
        # Replace types in field definitions
        # Pattern: indent, space, then old_type, then optional suffix, then rest of line
        # We use re.MULTILINE to match start of line + whitespace
        pattern = rf'^(\s+\w+\s+){old_type}([\?\[\]\s])'
        new_content = re.sub(pattern, rf'\1{new_type}\2', new_content, flags=re.MULTILINE)
        
    # Special case: 'tenant' type was renamed to 'tenants'
    # My rescue script already handled some, but let's be sure.
    new_content = new_content.replace(' tenant ', ' tenants ')
    new_content = new_content.replace(' tenant?', ' tenants?')
    new_content = new_content.replace(' tenant\n', ' tenants\n')

    with open(SCHEMA_PATH, 'w') as f:
        f.write(new_content)
    
    print("Final naming hardening complete.")

if __name__ == "__main__":
    harden_naming_final()
