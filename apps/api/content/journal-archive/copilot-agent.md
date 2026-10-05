An agent opening a pull request is a different idea from an assistant suggesting the next line. It moves the review conversation from a chat window into the repository.

## The 2025 announcement

On May 19, 2025, GitHub introduced a Copilot coding agent that could work on assigned issues in a GitHub Actions-powered environment and propose changes through draft pull requests. GitHub said existing branch protections remained in place and agent pull requests needed human approval before workflows ran. [GitHub's launch post](https://github.blog/news-insights/product-news/github-copilot-meet-the-new-coding-agent/)

This retrospective describes the launch, not today's subscription availability or a claim that every generated patch is safe.

## My suggested delegation contract

I would treat an agent task as a small engineering handoff. A useful issue needs more than "fix the bug."

For an illustrative contact-form fix, I would specify the failing behavior, the expected response, affected routes, and what must not change. I would also state that production credentials and database resets are out of scope.

An issue template I would use:

```text
Problem: duplicate submissions create duplicate records.
Expected behavior: repeated requests with the same key are idempotent.
Scope: contact API and its focused tests.
Constraints: preserve existing records and authorization behavior.
Evidence: include tests and explain any remaining uncertainty.
```

That example is not an instruction taken from GitHub; it is my proposed way to make a bounded task easier to review.

## Review the result, not the confidence

My review would start with the diff. Does the patch actually solve the reported behavior? Are tests exercising the failure or just confirming a happy path? Did an unrelated dependency or deployment file change?

I would also check whether the reviewer can explain the implementation without leaning on the agent's confident summary. A neat description is helpful, but it is not evidence that the system behaves correctly.

The appealing part of repository-based agents is a familiar trail of issues, changes, and review. Keep that trail meaningful. Delegating the first draft of a patch does not delegate accountability for merging it.
