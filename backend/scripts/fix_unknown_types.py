import re
import os

SCHEMA_PATH = r"prisma\schema.prisma"

def fix_unknown_types_final():
    with open(SCHEMA_PATH, 'r') as f:
        content = f.read()

    # 1. Models
    models = re.findall(r'model\s+(\w+)\s+\{', content)
    model_set = set(models)
    
    # 2. Manual Mapping
    manual_map = {
        'moduleLicensese': 'module_licenses',
        'moduleDefinition': 'module_definitions',
        'tenant': 'tenants',
        'trainingAssignment': 'training_assignments',
        'userNotificationPreference': 'user_notification_preferences',
        'hrProgramSkill': 'hr_program_skills',
        'retailCustomerAuth': 'retail_customer_auth',
        'retailCustomerSession': 'retail_customer_sessions',
        'paymentTransaction': 'payment_transactions',
        'workflowAuditEntry': 'workflow_audit_entries',
        'workflowInstance': 'workflow_instances'
    }

    new_content = content
    for old, new in manual_map.items():
        # Replace types in field definitions
        pattern = rf'^(\s+\w+\s+){old}([\?\[\]\s\n])'
        new_content = re.sub(pattern, rf'\1{new}\2', new_content, flags=re.MULTILINE)
        
    # 3. Surgical fix for unique index
    new_content = new_content.replace('@@unique([tenant_id, company_id, department, period])', '@@unique([tenant_id, company_id, department_id, period])')

    with open(SCHEMA_PATH, 'w') as f:
        f.write(new_content)
    
    print("Final type fixing complete.")

if __name__ == "__main__":
    fix_unknown_types_final()
