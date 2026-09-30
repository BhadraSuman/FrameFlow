# STATEMENT OF WORK
## Event Photo Selection Portal
### MVP delivery and future feature roadmap

| Field | Detail |
| :--- | :--- |
| **Document version** | 0.1 (Draft) |
| **Date** | 1 October 2026 |
| **Project** | Event Photo Selection Portal (SaaS for photographers and event agencies) / FrameFlow |
| **Client / Product owner** | [Name / Company] |
| **Delivery party** | [Developer / Agency name] |
| **Target market** | India (wedding, pre-wedding, corporate and school-event photographers) |
| **Status** | Planning. Scope, timelines and fees are proposals pending validation |

*Items in square brackets are placeholders to be completed before signature. Durations and effort figures are planning estimates, not commitments, until the validation gate in Section 9 is passed.*

---

## 1. Purpose and Background
This Statement of Work (SOW) defines the scope, deliverables, schedule, acceptance criteria and commercial terms for building the Event Photo Selection Portal, and records the planned future features so that they can be prioritised and contracted in later phases.

The product is a web platform on which a photographer or agency uploads event photos, shares a private gallery with a client, lets the client choose photos, and downloads the selected original files. It is positioned as a photo-selection and proofing workflow, not as general photo storage.

### 1.1 Objectives
- Deliver a working MVP that lets a photographer complete a real client selection job end to end.
- Keep the first release small, so that it can be tested with real photographers before further investment.
- Build on a storage-provider-agnostic design so the hosting choice can change later.
- Document a prioritised set of future features, each tied to a trigger that justifies building it.

### 1.2 Success measures
| Measure | Target (proposed) |
| :--- | :--- |
| **North-star metric** | Completed client selections per month |
| **Pilot completion** | At least 3 real events completed end to end by pilot studios |
| **Client completion rate** | 70% or more of invited clients submit a selection within 7 days |
| **Paid conversion** | At least 3 pilot studios agree to pay before Phase 2 starts |
| **Reliability** | Uploads of 2,000 photos complete with resume on interruption |

---

## 2. Scope of Work: Phase 1 (MVP)

### 2.1 In scope

#### Agency (photographer) features
- Registration, login, password reset and a dashboard of events.
- Event creation and management: name, type, date, client name, client email.
- Direct-to-storage photo upload with progress, retry and resume (multipart).
- Photo count, storage usage, gallery status and selection status per event.
- Automatic generation of a private gallery URL and a random PIN; invitation email to the client.
- Notification when the client submits a selection.
- Export of the selection as a filename list (CSV) in addition to the ZIP download. [Proposed addition, to be validated]
- Download of selected originals as a ZIP through a background job and a temporary signed link.
- Event expiry date, retention information and warning emails.

#### Client features
- Private gallery opened by URL and PIN, with a temporary session and no permanent account.
- Responsive thumbnail grid and lightbox preview.
- Select and unselect, live selection count, review screen, submit and confirmation.

#### System features
- Private object storage, presigned upload and download URLs, short-lived signed links.
- Background worker for thumbnails (small) and previews (medium) and for ZIP generation.
- Rate limiting, PIN brute-force protection, access control and audit logging.
- Automatic expiry with grace period and deletion, using storage lifecycle rules where possible.
- Basic monitoring, error logging and storage cost tracking.

### 2.2 Out of scope for Phase 1
- Team roles, white-label branding and custom domains.
- Album-page design proofing and multi-round approval workflows.
- Online payments, subscription billing and print sales.
- AI features (face search, culling, duplicate or blur detection).
- Native mobile apps and a desktop uploader.
- Migration of existing customer data from other platforms.

---

## 3. Roles and Responsibilities
| Role | Responsibility |
| :--- | :--- |
| **Product owner (Client)** | Final decisions on scope and priorities, supplies test users, approves deliverables within 5 working days |
| **Delivery lead / developer** | Design, build, test, deploy and document the platform; report progress weekly |
| **Pilot photographers** | Use the product on real events and give structured feedback |
| **Legal / compliance advisor [TBD]** | Reviews terms of service, privacy notice and data-protection obligations |
| **Designer [optional]** | UI review of gallery and dashboard |

---

## 4. Technical Approach
| Area | Proposed choice | Note |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS | Responsive web app, low-end phones supported for the client gallery |
| **Backend** | Node.js, Express, TypeScript | REST API |
| **Database** | PostgreSQL (managed) | Users, events, media, selections, rounds, sessions |
| **Object storage** | Cloudflare R2 (S3-compatible); AWS S3 as alternative | R2 has no egress fee; final choice depends on data-residency needs |
| **Background jobs** | BullMQ with Redis | Thumbnails, previews, ZIPs, email |
| **Image processing** | Sharp | Configurable output sizes |
| **Email** | Amazon SES, Resend or Postmark | Invitations, notifications, expiry warnings |
| **CDN** | Cloudflare CDN or CloudFront | Thumbnails and previews via signed URLs or cookies |

**Key principle:** Business logic talks to a `MediaStorageService` interface and never to a provider directly. Phase 1 implements one provider only; additional providers are a future item.

---

## 5. Deliverables and Milestones
Effort estimates assume one full-time developer. They are planning figures and will be confirmed at the validation gate.

| # | Milestone | Key deliverables | Est. duration |
| :--- | :--- | :--- | :--- |
| **M1** | Project setup | Repositories, CI, environments, authentication, database schema | 1 week |
| **M2** | Agency dashboard | Event creation, event list, storage usage, client details | 1 to 2 weeks |
| **M3** | Upload system | Presigned and multipart uploads, progress, resume, thumbnails, previews | 2 to 3 weeks |
| **M4** | Client gallery | Private URL, PIN, grid, lightbox, select and unselect | 2 weeks |
| **M5** | Selection workflow | Review, submit, notification, selection dashboard, CSV export | 1 to 2 weeks |
| **M6** | Download | Background ZIP, temporary signed URL | 1 week |
| **M7** | Retention | Expiry, warnings, grace period, deletion | 1 week |
| **M8** | Hardening and pilot | Security review, rate limits, monitoring, backups, pilot support | 2 weeks |

*Indicative total for Phase 1: about 11 to 14 weeks.*

---

## 6. Future Features Roadmap
The features below are not part of the Phase 1 price. Each phase is contracted separately through the change process in Section 10. A phase starts only when its trigger condition is met.

### 6.1 Phase 2: Professional workflow
*Trigger: at least 3 pilot studios complete real jobs and at least 3 agree to pay.*

| Feature | Description | Priority |
| :--- | :--- | :--- |
| **Subscription billing** | Plans, invoicing with GST, Indian payment gateway, pay-per-event option | High |
| **Selection rounds and shortlists** | Multiple rounds, revision after album draft, round history | High |
| **Client comments** | Comments on individual photos | High |
| **Selection limits and deadlines** | Maximum number of photos, due dates, reminder emails | Medium |
| **WhatsApp sharing** | Share gallery link and PIN through WhatsApp; messaging costs passed on or capped | High |
| **Agency branding** | Logo, colours, custom gallery message | Medium |
| **Paid retention** | Extend expiry by 30 days, 90 days or 1 year; prices to be validated | Medium |
| **Team members and roles** | Owner, admin, photographer, editor, designer | Medium |
| **Analytics** | Gallery opened, photos viewed, completion and time to completion | Low |

### 6.2 Phase 3: Album proofing and delivery
*Trigger: customers ask for album-stage approval and Phase 2 retention is at least 60% after 3 months.*

| Feature | Description | Priority |
| :--- | :--- | :--- |
| **Album design proofing** | Upload album spreads, page-level comments, client approval | High |
| **Designer and lab handoff** | Export selections for album designers, labs and Lightroom-style workflows, invite external designers | High |
| **Version history** | Track album versions and approvals | Medium |
| **Final delivery** | Delivery of edited finals after approval | Medium |
| **Custom domains and white-label** | Studio-branded galleries on the studio's own domain | Medium |
| **Desktop or plugin uploader** | Faster, resumable upload for large batches on slow connections | Medium |

### 6.3 Phase 4: AI and advanced features
*Trigger: steady usage with real volume, and evidence from users that manual sorting is the main pain.*

| Feature | Description | Priority |
| :--- | :--- | :--- |
| **Duplicate and similar detection** | Group near-identical frames | Medium |
| **Blur and closed-eye detection** | Flag likely rejects before sharing | Medium |
| **Face grouping and search** | Find photos of a person; needs explicit consent handling | Low |
| **AI-assisted shortlist** | Suggest a starting selection | Low |
| **Smart search** | Search by scene or content | Low |

### 6.4 Platform and compliance items (ongoing)
- **Data-protection compliance**: consent notices, breach reporting, deletion and access requests, and a privacy policy, aligned with India's DPDP Rules. The core obligations take effect on 13 May 2027, so this work should finish before then. A lawyer must confirm the requirements.
- **Additional storage providers**: behind the storage interface (S3, GCS, Azure) if a customer or cost reason arises.
- **Independent security review or penetration test** before scaling marketing.
- **Regional language support** for the client gallery.
- **Malware scanning** of uploads.
- **Public API and integrations**, only if customers request them.

### 6.5 Prioritisation rules
- A feature is built only if at least 5 customers have requested it or a pilot customer will pay for it.
- Features that reduce selection time or client confusion come before features that add breadth.
- AI features come last and only after the core workflow has real usage.

---

## 7. Non-Functional Requirements
| Area | Requirement |
| :--- | :--- |
| **Security** | Private storage, HTTPS, encryption at rest, Argon2 or bcrypt, rate-limited PIN attempts, short-lived signed URLs, no storage credentials in the browser, audit logs |
| **Performance** | Gallery grid loads first screen in under 3 seconds on a typical 4G connection (target) |
| **Reliability** | Resumable uploads; background jobs retried on failure; daily database backups |
| **Privacy** | Raw PINs never stored; retention dates clearly shown; deletion honoured on schedule |
| **Compatibility** | Current Chrome, Safari, Edge and Firefox; mobile browsers for the client gallery |
| **Cost control** | Storage and operations cost per event tracked; alerts when monthly spend exceeds a threshold [TBD] |
| **Maintainability** | TypeScript, automated tests for core flows, documented setup and deployment |

---

## 8. Acceptance Criteria
- A photographer can create an event, upload 2,000 photos and receive a working gallery link and PIN.
- A client can open the gallery on a mobile phone, enter the PIN, select photos and submit.
- The photographer is notified and can download the selected originals as a ZIP and a CSV of filenames.
- Wrong PIN attempts are rate limited, and gallery media is not reachable without a valid session.
- Expired events follow the warning, grace period and deletion sequence.
- No critical or high-severity defects are open at handover.
- The product owner will review each milestone within 5 working days. Silence after that period counts as acceptance of the milestone, unless otherwise agreed.

---

## 9. Assumptions, Dependencies and Validation Gate

### 9.1 Assumptions
- Target customers are Indian photographers and studios; the core problem is not yet validated.
- Cloud services (storage, email, hosting) are paid by the Client, billed at provider rates.
- The Client supplies test photographers and real events for pilots.
- Third-party pricing and rules (storage, WhatsApp, payment gateways) may change.

### 9.2 Validation gate before full build
Before committing to the full Phase 1 budget, complete these checks:
1. At least 20 photographer or studio interviews, with at least 12 naming photo selection as a top-3 pain.
2. At least 3 paid commitments or paid pilots at or above the proposed price point.
3. A written list of what the closest Indian competitors lack, and the planned differentiator.
*If these are not met, the project should be paused, reshaped or stopped rather than built out.*

---

## 10. Change Management
- All changes to scope, timeline or fees must be requested in writing.
- The delivery party provides an impact assessment (effort, cost, schedule) within 3 working days.
- Work on a change begins only after written approval from the product owner.
- Future-feature phases in Section 6 are handled as separate work orders under this SOW.

---

## 11. Risks
| Risk | Probability | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| **Customers do not pay for proofing** | High | High | Validation gate; paid pilots |
| **Crowded market with free tiers** | High | High | Focus on a clear differentiator such as designer and lab handoff |
| **Slow networks break large uploads** | Medium | Medium | Multipart resume; evaluate desktop uploader |
| **Data breach of private event photos** | Medium | High | Security controls, review, incident plan |
| **DPDP obligations missed** | Medium | Medium to High | Legal review; compliance work before May 2027 |
| **Storage or messaging costs rise** | Medium | Medium | Cost monitoring; provider abstraction; pricing review |
| **Scope creep into CRM, album designer or AI** | High | Medium | Prioritisation rules in Section 6.5 |

---

## 12. Commercial Terms
All amounts below are placeholders to be agreed. Amounts exclude GST and third-party cloud costs.

| Item | Amount | Payment trigger |
| :--- | :--- | :--- |
| **Validation phase (interviews, pilot prototype)** | ₹[●] | On start |
| **M1 to M3 (setup, dashboard, uploads)** | ₹[●] | On acceptance of M3 |
| **M4 to M6 (gallery, selection, download)** | ₹[●] | On acceptance of M6 |
| **M7 to M8 (retention, hardening, pilot)** | ₹[●] | On acceptance of M8 |
| **Phases 2 to 4** | Separate estimate per work order | As agreed |
| **Warranty** | [30] days free bug-fix after handover | Included |
| **Hosting and third-party services** | At cost, paid by Client | Monthly |

*Intellectual property, confidentiality, termination and liability terms: [to be added by legal advisor].*

---

## 13. Approval
| | Client | Delivery party |
| :--- | :--- | :--- |
| **Name** | | |
| **Title** | | |
| **Signature** | | |
| **Date** | | |
