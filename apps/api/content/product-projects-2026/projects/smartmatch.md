### From OCR text to business-ready data

SmartMatch OCR is a document-intelligence product built around a distinction: recognized text is an intermediate result, not automatically trusted business data. The product processes PDFs, scanned pages, images, and fax documents through extraction, validation, review, and finalization before downstream systems consume the result.

I built the API with **Node.js and Express**. The public OpenAPI 3.1 specification explains the processing contract; it does not disclose the underlying database or cloud infrastructure.

### Versioned extraction requirements

Each project defines what to extract through a **Target Profile**. Profiles can describe fields such as dates, amounts, names, or document-specific values, along with validation and matching rules.

Publishing a profile creates an immutable version. Documents reference a fixed profile version during processing, and responses include project and profile-version identifiers. This makes an extraction traceable to the requirements used for that processing run rather than to a silently changing configuration.

### A staged processing lifecycle

The documented workflow separates responsibilities into explicit stages:

1. **Upload:** create a document container and add image pages or a PDF.
2. **Pre-check:** assess input quality and whether required information can be located.
3. **AI processing:** submit an asynchronous OCR/extraction job to the configured provider.
4. **Interpretation and validation:** locate candidate values, normalize them, apply rules, and retain the source location needed for review.
5. **Review and approval:** route uncertain items to a reviewer and a separate approver.
6. **Finalization:** expose only confirmed data through the external-consumption endpoint.

The specification uses Google Document AI as an example external provider. That example is not a claim that it is the only deployed OCR engine.

### Human review as an API boundary

The documented review flow prevents the same person from acting as both primary reviewer and secondary approver. Outstanding review items block finalization, and disagreements have an explicit error response.

Intermediate extraction and validation results are permission-gated. The `/final` endpoint represents the downstream business-data boundary; a document that is not finalized must not be treated as ready for an accounting, ordering, or management integration.

### Retry safety, authorization, and auditability

The API contract documents bearer-token authentication using OIDC/JWT and role-based authorization. Mutating endpoints accept an `Idempotency-Key` so retries need not create duplicate work, particularly around asynchronous AI processing.

Provider failures, timeouts, invalid state transitions, and review conflicts are represented separately. Audit endpoints and configuration-version references support tracing how a document moved from upload to confirmed output.

These are documented interface and workflow capabilities, not evidence of a measured availability target or accuracy benchmark. The generated cover illustrates the document-to-reviewed-data flow; the live site and API reference show the current product.
