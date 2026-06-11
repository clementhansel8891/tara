# Bugfix Requirements Document

## Introduction

The Retail module suffers from two categories of defects preventing production use:

1. **E-Commerce Hierarchy Bug**: E-commerce entities (connectors, channels, stores) are modeled as separate top-level entities that *link TO* branches via `branchIds[]` or `branch_id`. The correct design should treat e-commerce as either a virtual branch (a `RetailStore` with type `"ecommerce"`) or as a nested entity within the branch hierarchy. Currently there is no proper entry point to register new e-commerce as a branch-level entity, and three overlapping e-commerce implementations create confusion.

2. **Comprehensive Functional Stability**: Multiple UI pages across both Management and Operational planes have non-functional buttons, incomplete flows, broken API calls, or missing backend implementations that prevent end-to-end workflows from completing.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user creates an e-commerce connector via `POST /retail/ecommerce-hub/connectors` THEN the system creates a standalone `EcommerceConnector` entity with a `branchIds[]` array linking TO existing branches, rather than placing e-commerce within the branch hierarchy itself

1.2 WHEN a user creates an e-commerce channel via `POST /retail/ecommerce-hub/channels` THEN the system creates a standalone `EcommerceChannel` entity with `branchIds[]` linking TO branches, leaving it outside the branch tree

1.3 WHEN a user creates a legacy e-commerce store via `POST /retail/ecommerce-stores` THEN the system creates a separate entity requiring manual `link-branch` calls to associate with branches, rather than being a branch-type entity

1.4 WHEN a user navigates to the EcommerceConnector management page THEN the system shows connectors/channels as flat lists without clear hierarchy positioning relative to the branch structure, and no option to register e-commerce AS a branch

1.5 WHEN three separate e-commerce systems (stores, connectors, channels) exist simultaneously THEN the system provides no unified entry point for creating e-commerce presence, confusing users about which system to use

1.6 WHEN a user attempts to use operational terminal functions (POS checkout, refund, stock opname, receiving, shift open/close, cash movement, self-service kiosk) THEN the system may fail due to missing or incomplete backend implementations, unresolved API endpoints, or broken frontend-to-backend data flows

1.7 WHEN a user clicks action buttons on management pages (Store Dashboard, Infrastructure Control, Device Control, Pricing Desk, Order Fulfillment, Inventory Visibility, Compliance Audit) THEN the system may show no response, display errors, or trigger incomplete actions due to stub implementations or missing API integrations

1.8 WHEN the `RetailContext` initializes and no stores or channels exist yet THEN the system sets `isConfigured: false` but provides no guided onboarding flow to create the first branch or e-commerce entity

### Expected Behavior (Correct)

2.1 WHEN a user creates an e-commerce entity THEN the system SHALL register it as a `RetailStore` with `type: "ecommerce"` (virtual branch) that participates in the standard branch hierarchy, inheriting the same operational_config, supply_config, and channel_binding capabilities as physical branches

2.2 WHEN a user creates an e-commerce channel THEN the system SHALL associate it within the branch hierarchy either as a sub-entity of an existing branch OR as its own virtual branch entity, with proper parent-child relationships visible in the UI

2.3 WHEN a user accesses the e-commerce management page THEN the system SHALL provide a single unified entry point to register new e-commerce entities that properly places them in the branch hierarchy (as virtual branches or inside branches)

2.4 WHEN a user views the store/branch list THEN the system SHALL display e-commerce entities alongside physical branches with a clear type indicator (physical vs. ecommerce/virtual), showing the complete hierarchy in one view

2.5 WHEN legacy e-commerce endpoints are called THEN the system SHALL either redirect to the unified hierarchy model or maintain backward-compatible behavior while internally mapping to the new structure

2.6 WHEN a user performs any operational terminal action (POS checkout, refund processing, stock opname scanning, goods receiving, shift open, shift close, cash movement, kiosk transaction) THEN the system SHALL complete the full end-to-end flow with proper API calls, data persistence, and user feedback

2.7 WHEN a user clicks any action button on any management page THEN the system SHALL execute the intended operation with proper API integration, display loading states during processing, and show success/error feedback upon completion

2.8 WHEN the module detects no configured branches/stores THEN the system SHALL present a guided onboarding wizard or clear call-to-action to create the first retail location (physical or e-commerce)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a physical `RetailStore` is created with type "flagship", "satellite", or "warehouse" THEN the system SHALL CONTINUE TO create it with full operational_config, supply_config, infrastructure_registry, and channel_binding capabilities as before

3.2 WHEN an existing `RetailStore` is updated via `PUT /retail/stores/:id` THEN the system SHALL CONTINUE TO update all fields (name, code, address, configs, governance) without data loss

3.3 WHEN a shift is opened via `POST /retail/shifts/open` for a physical store THEN the system SHALL CONTINUE TO create the shift record, validate no conflicting open shifts exist, and return the shift with opening_cash recorded

3.4 WHEN a checkout is processed via `POST /retail/checkout` with a valid active shift THEN the system SHALL CONTINUE TO validate shift status, create the order with all items, update inventory, process payment, and return the completed order

3.5 WHEN the `RetailContext` loads with existing stores and channels THEN the system SHALL CONTINUE TO auto-select the stored or first available store, maintain session persistence via localStorage, and avoid infinite re-render loops via the ref-based pattern

3.6 WHEN existing e-commerce hub API endpoints (`/retail/ecommerce-hub/connectors`, `/retail/ecommerce-hub/channels`) are called THEN the system SHALL CONTINUE TO support CRUD operations, API key rotation, credential management, and connection testing for backward compatibility

3.7 WHEN the `ModuleContract.getPages()` is called THEN the system SHALL CONTINUE TO return all 30+ page definitions with correct routes, icons, menu groupings, and permission requirements for both management and operational planes

3.8 WHEN privileged roles (SUPERADMIN, OWNER, ADMIN) access the retail module THEN the system SHALL CONTINUE TO bypass branch-gating restrictions and see all stores in the fleet view
