# Marketing Command — User Manual

> **Department:** Marketing & Growth  
> **Workspace:** Marketing Command — Omnichannel Growth & Audience Intelligence Matrix  
> **URL Base:** `/core/marketing`

---

## Role Access

| Role | Dashboard | Campaigns | Customer 360 | Lead Capture | Nurture | Social Connect | Audit |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Owner / Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marketing Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marketing Staff | 👁 | ✅ | 👁 | ✅ | ✅ | ✅ | 👁 |
| Sales (linked) | ❌ | ❌ | 👁 | ❌ | ❌ | ❌ | ❌ |

---

## Sidebar Navigation

```
Marketing Command
├── INTELLIGENCE
│   ├── Marketing Command     (/core/marketing/dashboard)
│   └── Impact Matrix         (/core/marketing/analytics)
├── GROWTH
│   ├── Customer 360          (/core/marketing/customer-360)
│   ├── Lead Capture          (/core/marketing/leads)
│   └── Funnel Matrix         (/core/marketing/funnels)
├── OMNICHANNEL
│   ├── Campaign Studio       (/core/marketing/campaigns)
│   ├── Nurture Hub           (/core/marketing/nurture)
│   ├── Social Connect        (/core/marketing/accounts)
│   └── Execution Desk        (/core/marketing/execution)
├── OPERATIONS
│   ├── Creative Library      (/core/marketing/creative)
│   └── Appointment Desk      (/core/marketing/appointments)
└── GOVERNANCE
    ├── Workflow              (/core/workflow?scope=Marketing)
    ├── Audit Vault           (/core/marketing/audit)
    └── Administration        (/core/marketing/admin)
```

---

## 1. Marketing Command Dashboard (`/core/marketing/dashboard`)

**Purpose:** Top-level marketing performance overview — campaign reach, lead generation volume, channel performance, and conversion rates.

### Reading the Dashboard
1. Navigate to **Marketing Command**.
2. The dashboard displays:
   - **Leads Generated (Month)** — total new leads from all marketing channels
   - **Campaign Reach** — total audience exposed to active campaigns
   - **Conversion Rate** — % of leads converted to sales-qualified opportunities
   - **Cost per Lead** — total marketing spend ÷ leads generated
   - **Active Campaigns** — number of campaigns currently running
3. Use the **Period Selector** to switch between weekly, monthly, or quarterly views.

### Quick Actions from Dashboard
- **New Campaign** → opens Campaign Studio
- **Import Leads** → opens Lead Capture Desk
- **View Alerts** → opens Marketing Alerts page

---

## 2. Impact Matrix — Marketing Analytics (`/core/marketing/analytics`)

**Purpose:** Deep analytics on marketing effectiveness, attribution, and ROI.

### Key Panels
- **Channel Attribution** — which channels (email, social, paid ads, events) drove the most leads
- **Campaign ROI Table** — spend vs. revenue generated per campaign
- **Funnel Drop-off** — where leads are being lost in the marketing funnel
- **Audience Engagement** — email open rates, click rates, social engagement
- **Geographic Distribution** — lead heatmap by location

### Steps
1. Navigate to **Marketing Command → Impact Matrix**.
2. Select **Time Period** from the filter bar.
3. Toggle between **Channel**, **Campaign**, or **Audience** views.
4. Click **Export** → download analytics as Excel or PDF.
5. Click **Share to Leadership** → routes report to exec via FlowGate.

---

## 3. Customer 360 (`/core/marketing/customer-360`)

**Purpose:** Full customer behavioral profile from a marketing perspective — purchase history, engagement data, lifetime value, and segment membership.

### Accessing a Customer Profile
1. Navigate to **Marketing Command → Customer 360**.
2. Search by **Name**, **Email**, or **Phone**.
3. Click the customer row.

### What You See in Customer 360 (Marketing View)
- **Demographics** — location, age group, acquisition source
- **Engagement Score** — how engaged this customer is with marketing (opens, clicks, visits)
- **Purchase Behavior** — average order value, purchase frequency, last purchase date
- **Segments** — which marketing segments this customer belongs to (e.g., VIP, Churned, High Spender)
- **Communication History** — all emails, SMS, and push notifications sent
- **Campaign Participation** — which campaigns this customer was included in

### Adding a Customer to a Segment
1. Open the customer profile.
2. In the **Segments** panel, click **Add to Segment**.
3. Select the relevant segment from the dropdown.
4. Click **Confirm**.

### Triggering a Nurture Sequence for a Customer
1. Open the customer profile.
2. Click **Enroll in Nurture Sequence**.
3. Select the **Sequence** from the Nurture Hub.
4. Click **Enroll**.

---

## 4. Lead Capture Desk (`/core/marketing/leads`)

**Purpose:** Form-based lead capture, lead source tracking, and qualification routing to Sales.

### 4.1 Viewing Captured Leads
1. Navigate to **Marketing Command → Lead Capture**.
2. The **Lead Table** shows all captured leads with:
   - Name, Email, Phone
   - Lead Source (Form, Social, Paid Ad, Event, Referral)
   - Capture Date
   - Status (New, Qualified, Sent to Sales, Disqualified)

### 4.2 Building a Capture Form
1. Click **New Form** in the WorkQueue.
2. Fill in:
   - **Form Name** (e.g., "Website Contact Form")
   - **Fields to Collect**: Name, Email, Phone, Company, Message (drag and drop to add)
   - **Thank You Message** (displayed after submission)
   - **Lead Source Tag** (to identify which campaign or channel)
3. Click **Save Form**.
4. Click **Get Embed Code** → copy and paste the HTML snippet into your website.
5. Or click **Get Share Link** → share the form URL directly.

### 4.3 Qualifying a Lead for Sales
1. Open a new lead from the Lead Table.
2. Review the information provided.
3. Select **Qualify** → the lead is marked as Sales Qualified.
4. Click **Send to Sales** → creates a Lead record in the Sales Command module.
5. Or select **Disqualify** with a reason if the lead doesn't meet criteria.

### 4.4 Bulk Lead Actions
1. Use checkboxes to select multiple leads.
2. Click **Bulk Actions**:
   - **Send to Sales** — qualify and hand off multiple leads
   - **Enroll in Sequence** — add to a Nurture Hub sequence
   - **Export** — download selected leads as CSV
   - **Disqualify** — mark as not suitable

---

## 5. Funnel Matrix — Funnel Builder (`/core/marketing/funnels`)

**Purpose:** Visual marketing funnel management — define stages, track conversions, and identify drop-off points.

### 5.1 Creating a Marketing Funnel
1. Navigate to **Marketing Command → Funnel Matrix**.
2. Click **New Funnel**.
3. Enter:
   - **Funnel Name** (e.g., "SaaS Trial Conversion Funnel")
   - **Goal** (e.g., "Free Trial → Paid Subscription")
4. Add **Stages** (drag to reorder):
   - Stage Name (e.g., Awareness, Interest, Consideration, Intent, Purchase)
   - Entry Trigger (how leads enter this stage)
   - Exit Criteria (what moves them to the next stage)
5. Click **Save Funnel**.

### 5.2 Reading Funnel Performance
1. Open an existing funnel.
2. Each stage shows:
   - **Entry Count** — leads who entered this stage
   - **Exit Count** — leads who progressed forward
   - **Drop-off %** — % who did not progress
   - **Avg. Time in Stage** — how long leads stay at this stage
3. Click a stage bar to drill into the individual leads at that stage.
4. Click **Export Funnel Report** for a detailed analytics download.

---

## 6. Campaign Studio (`/core/marketing/campaigns`)

**Purpose:** Create and manage multi-channel marketing campaigns — from planning to execution and measurement.

### 6.1 Creating a Campaign
1. Navigate to **Marketing Command → Campaign Studio**.
2. Click **New Campaign**.
3. Fill in:
   - **Campaign Name** (e.g., "Q3 Ramadan Promo")
   - **Campaign Type**: Email, Social, SMS, Event, Mixed
   - **Objective**: Brand Awareness, Lead Generation, Conversion, Retention
   - **Start Date** and **End Date**
   - **Target Audience** — select audience segments
   - **Budget** — total campaign budget
4. Click **Save Campaign** → saves as draft.

### 6.2 Adding Campaign Content
1. Open the draft campaign.
2. In the **Content** panel, click **Add Content Block**:
   - **Email Blast** — add subject line and body content
   - **Social Post** — compose post text, add image from Creative Library
   - **SMS** — add SMS message text
   - **Ad Creative** — upload ad banner and add UTM tracking link
3. Preview each content block using **Preview** button.

### 6.3 Scheduling the Campaign
1. In the **Schedule** panel, set:
   - **Send Date/Time** for each content block
   - **Time Zone** (auto-detected but can be overridden)
2. Click **Submit for Approval** → routes to Marketing Manager via FlowGate.

### 6.4 Launching a Campaign
1. After FlowGate approval, open the campaign.
2. Click **Launch Campaign** → all scheduled content is queued for delivery.
3. Status changes to **Active**.

### 6.5 Monitoring Campaign Performance
1. Open an active campaign.
2. The **Live Stats** panel shows real-time:
   - **Reach** — how many people received the campaign message
   - **Opens** — email/notification opens
   - **Clicks** — link clicks
   - **Conversions** — leads or purchases generated
   - **Cost per Conversion** — budget ÷ conversions

### 6.6 Pausing or Stopping a Campaign
1. Open an active campaign.
2. Click **Pause Campaign** → stops new sends but keeps stats.
3. Click **End Campaign** → finalizes and archives the campaign.

---

## 7. Nurture Hub (`/core/marketing/nurture`)

**Purpose:** Automated email and messaging sequences to nurture leads over time until they are sales-ready.

### 7.1 Creating a Nurture Sequence
1. Navigate to **Marketing Command → Nurture Hub**.
2. Click **New Sequence**.
3. Enter:
   - **Sequence Name** (e.g., "Cold Lead Warm-Up — 30 Day")
   - **Trigger**: enrollment by staff, form submission, or funnel stage
   - **Delay Type**: days after enrollment or after previous step
4. Add **Steps**:
   - **Day 0**: Welcome Email
   - **Day 3**: Follow-up Email with product info
   - **Day 7**: Case study or social proof email
   - **Day 14**: Special offer email
   - **Day 30**: Final call to action
5. For each step, click **Edit Content** to compose the email/SMS body.
6. Click **Activate Sequence**.

### 7.2 Enrolling Leads in a Sequence
1. Open a lead record from Lead Capture.
2. Click **Enroll in Sequence**.
3. Select the sequence from the dropdown.
4. Click **Enroll**.
5. The lead begins receiving the sequence on the defined schedule.

### 7.3 Monitoring Sequence Performance
1. Open a sequence.
2. The **Engagement Stats** panel shows per-step:
   - Sent, Opened, Clicked, Unsubscribed
3. Adjust sequence timing or content based on low-engagement steps.

---

## 8. Social Connect (`/core/marketing/accounts`)

**Purpose:** Connect and manage social media accounts for publishing and monitoring.

### 8.1 Connecting a Social Account
1. Navigate to **Marketing Command → Social Connect**.
2. Click **Connect Account**.
3. Select the platform: **Facebook**, **Instagram**, **LinkedIn**, **Twitter/X**, **TikTok**.
4. You will be redirected to the platform's authorization page.
5. Grant the required permissions.
6. The account appears in the **Connected Accounts** list.

### 8.2 Publishing a Post
1. Click **New Post** in the WorkQueue.
2. Select the **Connected Accounts** to publish on (select multiple for cross-posting).
3. Compose your post content.
4. Add an image from the **Creative Library** or upload directly.
5. Set a **Publish Date/Time** or click **Post Now**.
6. Click **Schedule Post** or **Publish Immediately**.

### 8.3 Monitoring Social Activity
The **Feed Panel** shows incoming mentions, comments, and messages across all connected accounts:
1. Click any mention/comment to open the post on the platform.
2. Click **Respond** to draft a reply within Zenvix.
3. Click **Escalate** to route a sensitive comment to the Marketing Manager.

---

## 9. Execution Desk (`/core/marketing/execution`)

**Purpose:** Campaign deployment dashboard — real-time execution status of all active marketing actions.

### Reading the Execution Desk
1. Navigate to **Marketing Command → Execution Desk**.
2. All active campaigns and sequences show with their real-time delivery status:
   - **Queued** — scheduled but not yet sent
   - **In Progress** — currently being sent
   - **Completed** — fully delivered
   - **Failed** — delivery error (see error details)
3. Click any item to see full delivery logs.

### Retrying a Failed Delivery
1. Click a **Failed** item.
2. Review the error reason (e.g., invalid email, rate limit, server error).
3. Click **Retry Delivery** for temporary errors.
4. For invalid contacts, update the contact information in Customer 360 first.

---

## 10. Creative Library (`/core/marketing/creative`)

**Purpose:** Central asset management — images, videos, documents, and brand templates.

### 10.1 Uploading an Asset
1. Navigate to **Marketing Command → Creative Library**.
2. Click **Upload Asset**.
3. Drag and drop or select your file (JPG, PNG, MP4, PDF, GIF).
4. Add metadata:
   - **Asset Name**
   - **Category** (Banner, Logo, Video, Copy Template, etc.)
   - **Tags** (for searchability)
5. Click **Save Asset**.

### 10.2 Using an Asset in a Campaign
1. When creating a Campaign or Social Post, click **Browse Creative Library**.
2. Search or filter by category/tag.
3. Click the asset to select it.
4. It is inserted into your content block automatically.

### 10.3 Organizing Assets
- Create **Folders** to organize by brand, campaign, or quarter.
- Click **New Folder** → enter folder name.
- Drag assets into folders.

---

## 11. Appointment Desk (`/core/marketing/appointments`)

**Purpose:** Booking management for marketing events, demos, consultations, and promotional activities.

### 11.1 Creating an Appointment Slot
1. Navigate to **Marketing Command → Appointment Desk**.
2. Click **New Availability Block**.
3. Set:
   - **Date and Time Range**
   - **Appointment Type** (Demo, Consultation, Event, Product Showcase)
   - **Max Capacity** (for events with multiple attendees)
   - **Staff Assigned**
4. Click **Save Availability**.

### 11.2 Booking an Appointment for a Customer
1. Click **New Booking** in the WorkQueue.
2. Search and select the **Customer** (from Customer 360).
3. Select the **Appointment Type** and **Time Slot**.
4. Add booking notes.
5. Click **Confirm Booking**.
6. A confirmation notification is sent to the customer.

### 11.3 Viewing the Booking Calendar
1. The **Calendar View** shows all scheduled appointments.
2. Switch between **Day**, **Week**, and **Month** views.
3. Click any appointment to view details or make changes.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Campaign not sending | Check if it's in Approved status — submit for FlowGate approval first |
| Lead capture form not working | Verify the embed code is correctly placed on your website |
| Social post failed to publish | Re-authorize the social account in Social Connect |
| Nurture sequence not triggering | Check that leads are actively enrolled and sequence is Activated |
| Analytics showing no data | Set the correct date range in the filter bar |

---

## Best Practices

- ✅ Always get campaign approval via FlowGate before launching — avoid unapproved communications.
- ✅ Use UTM tracking links in all campaign content for accurate attribution.
- ✅ Audit your Creative Library quarterly — remove outdated brand assets.
- ✅ Test nurture sequences with a sample audience before full rollout.
- ✅ Qualify leads before sending to Sales — unqualified leads waste sales team time.

---

*Return to [Master Index](./README.md)*
