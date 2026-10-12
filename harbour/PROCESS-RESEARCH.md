# Anguilla yacht workflow research

Research date: 5 October 2026. Purpose: improve Harbour's stakeholder demo. This is a product-design assessment of published sources, not a verified operational clearance procedure. No departments were contacted and no app behavior was changed.

## Main finding

Harbour's reusable yacht record and broker-led preparation remain useful. Its universal Immigration + Customs + Inland Revenue approval gate is an unverified assumption. Replace the single approval concept with separate process records, each owned by its responsible authority. Keep authority decisions independent.

## Evidence and proposed adjustments

### Arrival and departure clearance

The Anguilla Tourist Board directs private boats to contact and clear Customs and Immigration at Sandy Ground. Its guidance also identifies a separate Agriculture contact for pet importation. [Official entry guidance](https://ivisitanguilla.com/entry-requirements/)

Product proposal: retain Road Bay / Sandy Ground as the normal demo arrival location. Add estimated and actual arrival, origin and next destination, reporting appointment, Customs clearance evidence, Immigration review evidence, and outward-clearance tasks. Treat these fields as a proposed broker checklist until officers confirm the precise requirements. Track captain attendance where required; do not imply that broker submission itself completes entry.

The Pleasure Craft Regulations preserve specified arrival, inward-reporting and outward-clearance obligations and exclude vessels carrying cargo from their pleasure-craft classification. The posted text is dated 2002. [Pleasure Craft Regulations](https://customs.gov.ai/wp-content/uploads/2020/02/C169-Pleasure-Craft-Regulations.pdf)

Product proposal: ask whether this is private leisure, charter or another commercial operation, and whether cargo is carried. Route exceptional cases for manual confirmation; do not declare legal eligibility automatically.

### Cruising permissions and representation

The posted Cruising Permit Act addresses charter boats and gives Customs permit authority; its displayed consolidation date is 2000. This does not establish a universal private-yacht rule. [Act](https://customs.gov.ai/wp-content/uploads/2020/02/C165-Cruising-Permit-Act.pdf)

The posted 2010 Regulations assign applications to the Comptroller of Customs, require a local agent for charter-boat owners, and separate cruising permission from any person's entitlement to enter. Their form collects registered tonnage, port of registry, owner and agent details, permit period and start date. They provide for conditions and cancellation. [Regulations and forms](https://customs.gov.ai/wp-content/uploads/2020/02/C165-Cruising-Permit-Regulations.pdf)

Product proposal: add a distinct cruising-permit record, with authority reference, applicable conditions and its own validity. Collect the missing vessel/representation fields in a permit-specific section. Use numeric length and units separately from tonnage. Confirm applicability and current rules before enabling automatic eligibility or fee calculations.

### Marine parks and activities

The official Fisheries/Marine Resources brochure says applicants must possess clearance forms before applying for a marine-park mooring permit. It describes day-use restrictions and vessel restrictions on government moorings. Its fee table is labelled EC$, but the document has no clear current effective date. [Official marine-park brochure](https://naturalresources.gov.ai/wp-content/uploads/2022/02/NEW-MPA-Brochure.pdf)

The Fisheries Unit publishes marine-park application and permit forms and fishing-licence services. [Fisheries Unit](https://naturalresources.gov.ai/department/fisheries-unit/)

Product proposal: add planned anchorages and activities. When relevant, show marine-park and fishing tasks with the appropriate authority. Require clearance evidence before marking a marine-park application ready. Keep payment, permit issuance and compliance with conditions separate.

### Inland Revenue and fees

IRD describes its portal as supporting tax and licensing work, including business licences, GST and representation of businesses. I did not find an official source in this research establishing IRD as a mandatory clearance approver for every visiting yacht. Absence of evidence is not evidence that IRD has no role. [IRD portal guidance](https://ird.gov.ai/home/onlineportal)

Product proposal: move IRD to a conditional tax/licensing workstream pending confirmation. Give every fee an assessing authority, purpose, amount, currency, assessment date and receipt. Use manually recorded assessments in the demo; do not publish a supposedly current fee calculator based on old tables.

### Pre-arrival systems: unresolved conflict

SailClear lists Anguilla and describes its pre-arrival notification service as optional. CCLEC says captains still present documents to authorities on arrival. [SailClear](https://www.sailclear.com/) · [CCLEC service explanation](https://www.cclec.org/about-us/sailclear/)

A 2026 Caribbean Compass article carrying Noonsite guidance reports that SailClear is not operational locally. This secondary operational report conflicts with the provider listing. [Caribbean Compass](https://caribbeancompass.com/island-spotlight-anguilla/)

Product proposal: allow a broker to record an external notification reference and channel, with local availability marked unconfirmed. Do not advertise an integration, require SailClear, or label a pre-arrival notification as clearance. Do not import other islands' filing deadlines into Anguilla's workflow.

## Recommended demo structure

A visit progresses through preparation, ready to report, arrival processing, stay management and departure. These are coordination stages, not legal permissions.

Under each visit, use independent records for:

- Customs inward clearance and outward clearance.
- Immigration review, with private person-level exceptions where appropriate.
- Cruising permission, if applicable.
- Marine-park or activity permission, if applicable.
- Assessments and receipts, assigned to the collecting authority.
- Tax/business-licensing tasks only where confirmed relevant.

Each record should carry applicability (unconfirmed, required or confirmed not applicable), responsible authority, status, reference, dates, conditions, evidence and history. Only an authorised authority action can represent issuance; a broker recording evidence must be labelled distinctly.

Replace the global “Approved” badge with a visit-stage summary and separate authority outcomes. Verification should identify the particular clearance/permit and its scope, dates and conditions; a single yacht reference must not imply permission for every passenger or activity. Keep private identity details out of public verification.

## Changes to existing demo assumptions

- The current mandatory three-department gate is illustrative, not established by this research.
- The mandatory insurance filename is a demo check; the reviewed sources do not establish it as a universal entry requirement.
- Resetting every decision after every amendment is a demo rule, not a sourced requirement. Preserve the audit trail; later add authority-confirmed amendment handling by affected process.
- Generic “revoke/restore approval” controls should eventually become authority-specific cancellation and reissue records. Do not assume a cancelled official permit can simply be toggled back on.
- Existing QR assets still point to the earlier hosted demo; no shared live verification has been implemented.

## Questions for stakeholder validation

1. Which steps can a maritime agent complete, and when must the captain attend or sign?
2. Which current forms and declarations apply to private, charter, commercial and cargo-carrying vessels?
3. Is SailClear currently accepted at Road Bay? What notification deadlines, if any, apply?
4. What are the current permit, harbour, overtime and departure charges, currencies and exemptions?
5. When are cruising and marine-park permissions required, and which authority issues each?
6. Does IRD have a visit-level role, or only operator tax/licensing responsibilities?
7. Which amendments trigger which reviews, and what are the cancellation/reissue rules?
8. What identity information may be disclosed through a verification service?

Start with Customs at Road Bay and Immigration, then Natural Resources and IRD for their respective scope. Customs publishes Road Bay contact details on its official site. [Customs contacts](https://customs.gov.ai/contact/)

## Smallest useful implementation

First replace the universal approval summary with separate clearance, permit and payment statuses, add vessel-use classification and tonnage, and create an explicit departure checklist. Keep uncertain requirements labelled for stakeholder confirmation. Preserve the coastal design, broker preparation, correction responses and audit history.

## New evidence — 8 October 2026

The user supplied a completed clearance scan, a cruising-permit template and a photograph of the 2015 fee amendment. A newly located [2022 government consolidation](https://gov.ai/Legislation/Regulations/C165-Cruising%20Permit%20Regulations.pdf) corroborates that photographed schedule and supersedes the older fee evidence above for research purposes. Current operational acceptance and later amendments remain unverified.

See `MANUAL-PROCESS-MAPPING.md` for the source inventory, field gaps, tariff transcription, proposed document workflow and implementation acceptance checks. Application versus issuance, process-linked receipts and time-aware cruising validity are the next priorities. This evidence review changes documentation only; no new fields or calculations have been implemented yet.
