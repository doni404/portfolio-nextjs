A convincing chatbot demo can hide a fragile backend. Once real users arrive, the questions change: who can access this information, where did the answer come from, how much does it cost, and what happens when the model or a tool fails?

The useful architecture puts the model inside a controlled product workflow, not above it.

## Start with one useful job

Define what the assistant should help someone accomplish. "Answer questions about reservation availability" is a testable scope. "Be an intelligent assistant" is not.

Write down supported requests, required evidence, forbidden actions, and the point where a human should take over. A narrower scope gives you clearer evaluation and more honest failure messages.

## Put a backend between the browser and the model

Keep provider credentials server-side. Authenticate users before accessing private data and apply authorization again inside each tool or retrieval operation.

```text
User -> Application API -> Authorized context retrieval
                        -> Model provider adapter
                        -> Validated response or tool request
```

A provider adapter can translate your application contract into the selected API. OpenAI and Gemini are not interchangeable in every detail: message formats, streaming events, tool execution, and failure behavior need their own handling.

OpenAI's [production guidance](https://developers.openai.com/api/docs/guides/production-best-practices) covers key management and operational considerations. Avoid exposing credentials in frontend configuration even when a prototype makes that convenient.

## Give the model evidence, not authority

Retrieve only context the current user is allowed to see. Keep a reference to the source material so the response can show where important statements came from.

Treat retrieved documents and user messages as untrusted input. A paragraph that says "ignore all previous instructions" is content, not an instruction your application should obey.

For consequential actions, use typed tool inputs, validate them, re-check permissions, and require confirmation where appropriate. The model proposes; application code decides what is allowed.

## Streaming should improve clarity

Streaming can make an answer feel responsive by showing text before completion. It does not make the full generation finish sooner. OpenAI's [streaming guide](https://developers.openai.com/api/docs/guides/streaming-responses) also notes the moderation challenges of partial output.

Handle disconnection, cancellation, and mid-stream errors. If a partial response fails, mark it as incomplete instead of storing it as a finished answer. Do not replay a side-effecting tool call merely because the browser reconnects.

## Evaluate the workflow, not the demo

Build a small test set from representative questions and expected evidence. Include ambiguous requests, missing context, unsupported questions, and attempts to cross permission boundaries.

Score whether the answer is grounded, useful, and within scope. Check tool selection and tool arguments separately from writing quality. OpenAI's [safety guidance](https://developers.openai.com/api/docs/guides/safety-best-practices) recommends adversarial testing and human oversight; your product needs its own acceptance criteria too.

Pin and record the prompt, model configuration, and retrieval version used in each evaluation. Re-run the set when any of those changes.

## Budget for reliability

Limit input size, output length, concurrent requests, and tool iterations. Apply backoff to retryable provider failures, but keep a total request budget so retries cannot run indefinitely.

Track latency, usage, failed requests, and user feedback. Log enough context for diagnosis without collecting unnecessary private conversation data.

The goal is not a chatbot that answers everything. It is one that earns trust by answering the right things, showing its limits, and failing in ways the product can handle.
