"""
Second-pass fix:
- `ctx.tenant_id,` as shorthand object property → `tenant_id: ctx.tenant_id,`
- `ctx.tenant_id\n` (end of object)             → `tenant_id: ctx.tenant_id`
- repo calls `this.x.y(ctx.tenant_id,` → `this.x.y(ctx,`  (repo expects TenantContext not string)
- event bus / audit `tenant_id: ctx.tenant_id` are FINE — leave those alone
"""
import os, re

BASE = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2"
FILES = [
    r"backend\src\modules\retail\retail.service.ts",
    r"backend\src\core\inventory\inventory.service.ts",
    r"backend\src\core\marketing\marketing.service.ts",
    r"backend\src\core\procurement\procurement.service.ts",
    r"backend\src\core\sales\sales.service.ts",
    r"backend\src\shared\iot\universal-iot.service.ts",
]

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()
    original = src

    # 1. Shorthand `ctx.tenant_id,` inside object literals → `tenant_id: ctx.tenant_id,`
    #    These appear in auditService.log({  ctx.tenant_id,  user_id, ...})
    #    Preceded by `{` or newline+spaces on same or previous line
    src = re.sub(
        r'(\{[^}]*?\n\s+|,\s*\n\s*)ctx\.tenant_id,',
        lambda m: m.group(0).replace('ctx.tenant_id,', 'tenant_id: ctx.tenant_id,'),
        src
    )

    # 2. Simpler: any `ctx.tenant_id,` that appears at start of a line (indented) inside {} is a shorthand
    src = re.sub(r'^(\s+)ctx\.tenant_id,\s*$', r'\1tenant_id: ctx.tenant_id,', src, flags=re.MULTILINE)

    # 3. Same but without trailing comma (last property in object)
    src = re.sub(r'^(\s+)ctx\.tenant_id\s*$', r'\1tenant_id: ctx.tenant_id', src, flags=re.MULTILINE)

    # 4. Repo/service calls passing ctx.tenant_id as first positional arg (where TenantContext is expected)
    #    Pattern: this.someRepo.someMethod(ctx.tenant_id,
    src = re.sub(r'(this\.\w+\.\w+\()ctx\.tenant_id,', r'\1ctx,', src)
    # Same but single arg: this.x.y(ctx.tenant_id)
    src = re.sub(r'(this\.\w+\.\w+\()ctx\.tenant_id\)', r'\1ctx)', src)

    # 5. IoT-specific: event bus `tenant_id: ctx.tenant_id` inside eventBus.publish() is fine
    #    But `tenant_id,` shorthand in event payload is wrong
    src = re.sub(r'^(\s+)ctx\.tenant_id,\s*$', r'\1tenant_id: ctx.tenant_id,', src, flags=re.MULTILINE)

    if src != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(src)
        # Count changes
        diff = sum(1 for a, b in zip(original.splitlines(), src.splitlines()) if a != b)
        print(f"  Fixed {diff} lines: {os.path.basename(path)}")
    else:
        print(f"  No changes: {os.path.basename(path)}")

print("=== Second-pass fix ===")
for rel in FILES:
    p = os.path.join(BASE, rel)
    if os.path.exists(p):
        fix(p)
    else:
        print(f"  MISSING: {rel}")
print("Done.")
