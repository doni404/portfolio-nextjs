The interesting part of AI automation is not that an assistant can click a button. It is whether the assistant understands the task, stays within its authority, and leaves a result you can verify.

## The March 2026 announcement

OpenAI introduced GPT-5.4 on March 5, 2026, across ChatGPT, the API, and Codex. The announcement brought together reasoning, coding, and professional-workflow capabilities, and described native computer-use support. Those interfaces and access conditions are not interchangeable; integrations must use the documented API or product features actually available to them. [OpenAI's launch post](https://openai.com/index/introducing-gpt-5-4/) gives the original context.

## Why computer use changes the risk

A text answer can be reviewed before anyone acts on it. An assistant operating a computer may encounter controls that send messages, modify files, or change a live service.

For an illustrative invoice workflow, reading a total and drafting a summary is different from approving a payment. Those actions need different permissions even if they appear on the same screen.

## Design the boundary first

Define allowed destinations, permitted actions, and approval points. Separate read-only inspection from changes. A successful click is not enough; check that the intended state actually changed.

Prefer a structured API when it provides a clearer, more reliable operation. UI automation is useful when a task genuinely requires the interface, but it should not replace a well-defined service contract without a reason.

## Keep an audit trail people can use

Record the task, important actions, verification results, and unresolved uncertainty. Avoid storing credentials or unnecessary personal data in screenshots and logs.

If an action's outcome is ambiguous, stop and inspect before repeating it. A retry that creates a second payment, message, or expensive generation request is not a recovery strategy.

## The lasting lesson

My interpretation is that these capabilities make broader assistance possible, but operational discipline becomes more important as assistants gain the ability to act. Start with a small workflow, restrict authority, and require evidence before calling it complete.

This article is an engineering retrospective, not a report of a production benchmark or an endorsement of unrestricted autonomous control.
