"""
Final surgical fix: find ALL instances of `tenant_id: ctx.tenant_id,` that appear
as positional function arguments (NOT inside object literals `{ }`)
and replace them with `ctx,`

Heuristic: if the line is `      tenant_id: ctx.tenant_id,` and the preceding line is
`await this.x.y(` or `return this.x.y(` or just ends with `(`, it's a positional arg.
"""
import os, re

BASE = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2"
FILES = [
    r"backend\src\modules\retail\retail.service.ts",
    r"backend\src\core\inventory\inventory.service.ts",
    r"backend\src\core\marketing\marketing.service.ts",
    r"backend\src\core\procurement\procurement.service.ts",
    r"backend\src\core\sales\sales.service.ts",
]

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    changed = 0
    out = []
    for i, line in enumerate(lines):
        # Pattern: line contains `tenant_id: ctx.tenant_id,` as a positional argument
        # i.e. it's NOT the first key inside an object literal ({ tenant_id: ...})
        # but rather the FIRST positional arg to a function call that got corrupted
        stripped = line.strip()
        if stripped == 'tenant_id: ctx.tenant_id,':
            # Look at previous non-blank line
            prev = out[-1].rstrip() if out else ''
            # If previous line ends with `(` it's a function call arg → replace with `ctx,`
            if prev.endswith('('):
                indent = len(line) - len(line.lstrip())
                line = ' ' * indent + 'ctx,\n'
                changed += 1
        out.append(line)

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(out)
        print(f"  Fixed {changed} positional args: {os.path.basename(path)}")
    else:
        print(f"  No positional arg issues: {os.path.basename(path)}")

print("=== Positional arg fix ===")
for rel in FILES:
    p = os.path.join(BASE, rel)
    if os.path.exists(p):
        fix(p)
print("Done.")
