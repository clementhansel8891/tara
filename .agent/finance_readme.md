# finance/assets/fixed_asset_lifecycle_and_depreciation.md

## Fixed Asset Lifecycle & Depreciation Module (CAPEX Governance + IFRS/PSAK Compliance)

The **Fixed Asset Lifecycle & Depreciation Module** governs:

- Asset acquisition
- Commissioning / capitalization
- Depreciation calculation
- Impairment recognition
- Asset disposal
- Asset revaluation
- CAPEX approval workflow
- Audit evidence for all asset movements

Zenvix now covers the full fixed asset lifecycle required by enterprise finance.

---

## 1. Purpose

This module guarantees:

- All CAPEX is approved, tracked, and capitalized
- Depreciation is calculated according to IFRS/PSAK rules
- Asset disposal and impairment events are traceable
- Fixed asset reporting aligns with statutory requirements
- Audit packs include full asset evidence

Rule:

no_asset_can_be_capitalized_without_approval = true

## 2. Asset Lifecycle Stages

Stage Description
Acquisition Purchase order + budget verification
Commissioning Capitalization in asset register
Depreciation Scheduled according to asset class
Revaluation Optional market/value adjustments
Impairment Recognize losses per accounting standard
Disposal Sale, retirement, or write-off
Audit Evidence generation for all events

## 3. Asset Master Register

All assets must have:

asset_master_record:
asset_id: FA-2026-001
description: Office Building Bali
asset_class: Building
location: Bali Branch
acquisition_date: 2026-01-01
acquisition_cost: 50B IDR
useful_life_years: 25
depreciation_method: straight_line
residual_value: 5B IDR
status: active
Rule:

all_assets_must_be_registered_before_depreciation = true

### 1. Depreciation Calculation

Zenvix supports:

Straight-line

Declining balance

Unit-of-production

Example:

depreciation_schedule:
asset_id: FA-2026-001
method: straight_line
annual_depreciation: 1.8B IDR
accumulated_depreciation: 1.8B IDR
Rule:

depreciation_posting_requires_cfo_signoff_if_material = true

#### 1. Asset Revaluation & Impairment

Revaluation aligns with market / fair value

Impairment is recorded if recoverable amount < carrying value

Example:

impairment_event:
asset_id: FA-2026-002
impairment_amount: 500M IDR
reason: Fire damage
approved_by: CFO
audit_logged: true
Rule:

impairment_requires_approval_and_audit_log = true

#### 2. CAPEX Governance

Every capital expenditure must:

Be within budget

Be approved by HOD + CFO

Be linked to project or department

Example:

capex_request:
asset_description: New Machinery
requested_amount: 3B IDR
department: Production
approved_by: - HOD - CFO
status: capitalized
Rule:

asset_acquisition_must_match_budget_and_approval = true

#### 3. Asset Disposal / Retirement

Disposal includes:

Sale, write-off, or retirement

Approval workflow

Recording of gain/loss

Example:

disposal_event:
asset_id: FA-2026-003
disposal_type: sale
proceeds: 1B IDR
gain_loss: -200M IDR
approved_by: CFO
audit_logged: true
Rule:

no_disposal_without_approval_and_audit_pack = true

#### 4. Audit Pack Requirements

For all asset events:

Acquisition + budget approval

Commissioning + capitalization proof

Depreciation calculations

Revaluation / impairment documentation

Disposal evidence

Rule:

asset_event_without_audit_pack_is_invalid = true

#### 5. Competitor Parity Notes

With this module, Zenvix matches:

SAP Fixed Asset Accounting (FI-AA)

Oracle Asset Management

NetSuite Fixed Assets

Dynamics 365 Finance Asset Controls

Asset lifecycle is fully governed, CAPEX is controlled, IFRS/PSAK-compliant.

Locked Guarantees
Fixed Asset Lifecycle & Depreciation guarantees:

CAPEX budget adherence

Asset capitalization governance

Depreciation & impairment compliance

Disposal & revaluation traceability

Audit-proof evidence for all
