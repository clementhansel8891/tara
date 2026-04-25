"""
Final pass: replace ALL remaining `ctx.tenant_id` shorthand inside object literals.
These appear two ways:
  1. Inline:  { ctx.tenant_id, user_id, ...}  →  { tenant_id: ctx.tenant_id, user_id, ...}
  2. On its own line (already handled in pass 2, but just in case)

Also handle the specific where-clause pattern:
  { ctx.tenant_id, id: ..., status: ... }  →  { tenant_id: ctx.tenant_id, id: ..., status: ... }
"""
import os, re

BASE = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2"
FILES = [
    r"backend\src\core\inventory\inventory.service.ts",
    r"backend\src\core\procurement\procurement.service.ts",
    r"backend\src\modules\retail\retail.service.ts",
]

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()
    original = src

    # Replace `ctx.tenant_id` when used as a shorthand property inside { }
    # i.e., preceded by `{ ` or `, ` and followed by `,` or `}`
    # Pattern:  { ctx.tenant_id,   or   , ctx.tenant_id,  or  , ctx.tenant_id }
    src = re.sub(r'(?<=\{)\s*ctx\.tenant_id\s*(?=[,}])', ' tenant_id: ctx.tenant_id', src)
    src = re.sub(r'(?<=,)\s*ctx\.tenant_id\s*(?=[,}])', ' tenant_id: ctx.tenant_id', src)

    # Also catch when it's the first thing on a line inside an object (multiline)
    src = re.sub(r'^(\s+)ctx\.tenant_id\s*([,}])', r'\1tenant_id: ctx.tenant_id\2', src, flags=re.MULTILINE)

    if src != original:
        count = sum(1 for a,b in zip(original.splitlines(), src.splitlines()) if a != b)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(src)
        print(f"  Fixed {count} lines: {os.path.basename(path)}")
    else:
        print(f"  No changes: {os.path.basename(path)}")

print("=== Final shorthand fix ===")
for rel in FILES:
    p = os.path.join(BASE, rel)
    if os.path.exists(p):
        fix(p)
print("Done.")
