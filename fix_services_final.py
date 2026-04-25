"""
Surgical fix for service files corrupted by the automated refactoring.

Two corruption patterns:
1. `ctx.tenant_id: ctx.tenant_id` (invalid object key) → `tenant_id: ctx.tenant_id`
2. Bare `tenant_id` references in method bodies where param is now `ctx: TenantContext`
   - `(tenant_id,` → `(ctx,`
   - `tenant_id,\n` (shorthand in object) → `ctx.tenant_id,\n`
   - `tenant_id\n` (shorthand at end of object) → `ctx.tenant_id\n`
"""

import os
import re

BASE = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2"

FILES = [
    r"backend\src\core\inventory\inventory.service.ts",
    r"backend\src\core\marketing\marketing.service.ts",
    r"backend\src\core\procurement\procurement.service.ts",
    r"backend\src\core\sales\sales.service.ts",
    r"backend\src\modules\retail\retail.service.ts",
    r"backend\src\shared\iot\universal-iot.service.ts",
]

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()

    original = src

    # ─── Pattern 1: invalid object key produced by the script ────────────────
    # e.g.  { ctx.tenant_id: ctx.tenant_id ,
    src = re.sub(r'\bctx\.tenant_id\s*:\s*ctx\.tenant_id\b', 'tenant_id: ctx.tenant_id', src)

    # ─── Pattern 2: shorthand `tenant_id,` inside object literals ────────────
    # Only replace when it appears as a standalone shorthand (preceded by { or , or newline+spaces)
    # e.g.         tenant_id,
    #              tenant_id\n  (end of object)
    # We must NOT replace `tenant_id:` (property names) – those are handled above
    src = re.sub(r'(?<![.\w])tenant_id(?!\s*[:\w])', 'ctx.tenant_id', src)

    # ─── Pattern 3: leftover bare method calls passing tenant_id as first arg ─
    # e.g. this.repository.foo(tenant_id, ...)  →  this.repository.foo(ctx, ...)
    # Already handled by above (tenant_id → ctx.tenant_id), but ctx is TenantContext
    # so passing `ctx.tenant_id` where `ctx` is expected is wrong.
    # We can't perfectly distinguish here without AST, so we check call patterns:
    # If the function expects (ctx: TenantContext) the repo calls need `ctx`, not `ctx.tenant_id`.
    # We fix the specific pattern `this.<anything>.<method>(ctx.tenant_id,` → `this.<anything>.<method>(ctx,`
    src = re.sub(
        r'(this\.\w+\.\w+\()ctx\.tenant_id(,)',
        r'\1ctx\2',
        src
    )
    # Also fix (ctx.tenant_id) at end of call (single arg)
    src = re.sub(
        r'(this\.\w+\.\w+\()ctx\.tenant_id(\))',
        r'\1ctx\2',
        src
    )

    # ─── Pattern 4: universal-iot.service.ts still uses tenant_id: string ────
    # Update method signatures to accept ctx: TenantContext
    # and add the import if missing
    if 'universal-iot.service.ts' in path:
        if 'TenantContext' not in src:
            src = "import { TenantContext } from '../../gateway/tenant-context.interface';\n" + src
        # Fix method signature
        src = src.replace(
            'async handleTelemetry(\n    tenant_id: string,',
            'async handleTelemetry(\n    ctx: TenantContext,'
        )
        src = src.replace(
            'async syncNormalizedData(tenant_id: string,',
            'async syncNormalizedData(ctx: TenantContext,'
        )
        # Fix repository calls that still pass the string
        src = src.replace(
            'await this.repository.logTelemetry(ctx.tenant_id, readings)',
            'await this.repository.logTelemetry(ctx, readings)'
        )
        src = src.replace(
            'await this.repository.getAggregatedReport(\n        ctx.tenant_id,',
            'await this.repository.getAggregatedReport(\n        ctx,'
        )
        # audit log fields
        src = src.replace('tenant_id: ctx.tenant_id,\n                user_id:', 'tenant_id: ctx.tenant_id,\n                user_id:')

    if src != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(src)
        print(f"  Fixed: {os.path.basename(path)}")
    else:
        print(f"  No changes: {os.path.basename(path)}")

print("=== Fixing service files ===")
for rel in FILES:
    p = os.path.join(BASE, rel)
    if os.path.exists(p):
        fix(p)
    else:
        print(f"  MISSING: {rel}")

print("\nDone.")
