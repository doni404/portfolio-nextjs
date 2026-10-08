### A planning layer before the first commit

Planpresso helps founders, developers, and independent builders turn a rough idea into a plan they can inspect before handing it to a coding agent. Its role is to clarify the product, not to promise that an AI can automatically ship it.

The workspace connects discovery questions, stack decisions, scope boundaries, and implementation tasks. English is the default, with an optional Indonesian interface and document language.

### Four steps, with the builder in control

1. **Describe the idea.** Start with a short text brief and optionally add the audience, platform, and constraints.
2. **Answer focused questions.** AI generates idea-specific discovery questions. The builder can choose an answer, supply their own, or skip a question rather than invent certainty.
3. **Choose the stack.** Compare Simple, Balanced, and Professional bundles, then edit the recommendation and review its rationale.
4. **Approve the scope.** A feature map separates MVP, Later, and Excluded items. Acceptance checks and release decisions stay connected to the brief.

The final step chooses the intended coding tool before generating the PRD. This makes the handoff an explicit product decision, rather than a generic prompt appended at the end.

### Structured generation, not a wall of chat

The application uses **Next.js, React, and TypeScript**, with **Prisma and PostgreSQL** for persisted projects, briefs, document versions, and generation jobs. **Better Auth** provides Google sign-in; server-side ownership checks restrict project operations to the signed-in owner.

AI discovery and PRD generation use the **OpenAI Responses API with Structured Outputs**. A complete PRD has fourteen sections covering the product and its implementation, including requirements, architecture, data and API design, UX, deployment, acceptance criteria, and ordered tasks. The output is validated before it becomes a saved document.

Generation runs in a separate durable worker rather than depending on an open browser tab. A job records its chosen model and brief, moves through a queue, and is claimed with a lease. Bounded concurrency, deadline handling, progress reporting, and interrupted-job recovery make a slow provider response visible and manageable.

Monthly generation allowances are claimed atomically. Queued jobs can be canceled, and the worker does not silently repeat a paid request after a failure. Restoring an app allowance is deliberately separate from the provider's billing: an interrupted request may still incur an external charge.

### Documents that can evolve

The PRD reader supports section editing as well as a complete editor for scope, tasks, decisions, and stack details. Saved revisions provide an inspectable history; restoring a version also restores its matching brief, so the document and the decisions behind it stay aligned.

Projects can be archived and moved to recoverable Trash without replacing the database or discarding every revision. Changing an export target does not retroactively rewrite an older PRD's wording; the authored document and its selected handoff format remain distinct.

### A portable handoff to coding agents

Markdown and ZIP exports package the plan for **Codex, Claude Code, Cursor, OpenCode, Antigravity, Pi, or a general workflow**. Each adapter supplies the relevant instruction-file layout alongside the PRD, implementation plan, tasks, decisions, and bootstrap, continuation, and verification prompts.

The export preserves MVP boundaries: implementation tasks map to MVP requirements, while Later and Excluded features stay outside that task list. A manifest records the adapter version, locale, revision, review blockers, and file checksums. Stable file ordering makes packs deterministic and easier to compare.

These packs propose implementation work. They do not execute code, override existing repository instructions, or authorize a deployment. An authored sample lets visitors inspect the planning format and download a pack without generating a paid AI response.

### Shipping a small, deliberate beta

Web and worker images are built in **GitHub Actions**, published to **GHCR**, and pulled by **Coolify**. Building outside the application server keeps compilation away from the constrained runtime host.

Planpresso uses a separate PostgreSQL database with distinct migration and runtime roles. The runtime role has the required data access without schema-changing privileges. Application ownership checks provide the per-user boundary; sharing a database host does not mean the services have independent CPU, memory, or recovery capacity.

The beta starts with a single generation worker and a small connection pool. A backup was restored into an isolated database during deployment verification. Off-instance backup storage, sustained load testing, paid billing, and image/document processing remain follow-on work, not claimed launch capabilities.
