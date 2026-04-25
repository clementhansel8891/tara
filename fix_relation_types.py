import sys
import re

filepath = r"c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2\prisma\schema.prisma"

with open(filepath, 'r') as f:
    content = f.read()

# Find all model names
model_names = re.findall(r'model (\w+) \{', content)
model_map = {}
for m in model_names:
    # Try to guess the camelCase version if it was renamed
    # If model is plural snake_case, its old version might have been camelCase singular
    # This is hard to guess perfectly, but we can try to match them.
    pass

# Better approach: 
# If we see a type that looks like camelCase, and we have a plural snake_case model that matches, rename it.
def to_snake(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def to_plural(name):
    if name.endswith('s'): return name
    if name.endswith('y'): return name[:-1] + 'ies'
    return name + 's'

for m in model_names:
    # If m is already plural snake case
    # Try to find occurrences of its singular camelCase version as a type
    singular_snake = m.rstrip('s')
    # This is a bit risky.
    
# Let's just fix the specific ones from the error log first.
replacements = {
    "financeApPaymentAllocation": "finance_ap_payment_allocations",
    "retailLoadBalancer": "retail_load_balancers",
    "adminModuleStatus": "admin_module_statuses",
    "agenticEvent": "agentic_events",
    "assetEvent": "asset_events",
    "auditLog": "audit_logs",
    "bulletinComment": "bulletin_comments",
    "chatMember": "chat_members",
    "clinicReservation": "clinic_reservations",
    "compensation": "compensations",
    "costLayer": "cost_layers",
    "department": "departments",
    "employee": "employees",
    "farmingSensorLog": "farming_sensor_logs",
    "financeAccountBalanceSnapshot": "finance_account_balance_snapshots",
    "financeBudgetLine": "finance_budget_lines",
    "financeExpensePolicy": "finance_expense_policies",
    "financeInsight": "finance_insights",
    "financeJournalReversal": "finance_journal_reversals",
    "financeLedgerEventLogArchive": "finance_ledger_event_log_archive",
    "financeLedgerIdempotency": "finance_ledger_idempotency",
    "financeReconMatche": "finance_recon_matches",
    "financeSystemMapping": "finance_system_mappings",
    "financeTransactionTax": "finance_transaction_taxes",
    "fnbIngredient": "fnb_ingredients",
    "hrBudgetScenario": "hr_budget_scenarios",
    "hrCareerPath": "hr_career_paths",
    "hrComplianceModule": "hr_compliance_modules",
    "hrContextSnapshot": "hr_context_snapshots",
    "hrHeadcountPlan": "hr_headcount_plans",
}

for old, new in replacements.items():
    content = content.replace(f" {old} ", f" {new} ")
    content = content.replace(f" {old}[]", f" {new}[]")
    content = content.replace(f" {old}?", f" {new}?")

with open(filepath, 'w') as f:
    f.write(content)

print("Fixed relation types in schema.prisma")
