import re
import os

SCHEMA_PATH = r"prisma\schema.prisma"

def rescue_schema():
    with open(SCHEMA_PATH, 'r') as f:
        content = f.read()

    # Split by model blocks
    # We look for 'model ANY_NAME { ... // @@map("REAL_NAME") - standardized'
    # and replace ANY_NAME with REAL_NAME.
    
    # We'll use a more surgical approach.
    blocks = re.split(r'\nmodel ', content)
    new_blocks = [blocks[0]]
    
    for block in blocks[1:]:
        # Find the REAL_NAME from the comment
        map_match = re.search(r'// @@map\("(.*?)"\) - standardized', block)
        if map_match:
            real_name = map_match.group(1)
            # Replace the first word (the corrupted name) with real_name
            # Block starts with "NAME {"
            new_block = re.sub(r'^(\w+)', real_name, block)
            new_blocks.append(new_block)
        else:
            # If no map comment, just keep it (might be enum or something else handled later)
            new_blocks.append(block)

    new_content = '\nmodel '.join(new_blocks)
    
    # Also fix the tenant reference I broke
    new_content = new_content.replace('tenants tenant', 'tenants tenants')

    with open(SCHEMA_PATH, 'w') as f:
        f.write(new_content)
    
    print("Schema rescue complete.")

if __name__ == "__main__":
    rescue_schema()
