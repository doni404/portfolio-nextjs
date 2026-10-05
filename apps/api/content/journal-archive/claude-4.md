An agent is more than a language model with permission to call tools. It is a system that can make progress, notice failure, and stop at the right boundary.

## The May 2025 release

Anthropic introduced Claude Opus 4 and Claude Sonnet 4 on May 22, 2025. The announcement emphasized coding, extended thinking, tool use, and longer-running agent workflows. Claude Code also became generally available. Vendor demonstrations of sustained work show an intended capability; they are not a reliability guarantee for every repository or application. [Anthropic's announcement](https://www.anthropic.com/news/claude-4) documents the release scope.

## Capability needs an operating envelope

For an illustrative maintenance agent, the goal could be to fix a failing test. The operating envelope should state which repository it may access, which files it can change, whether it may use the network, and which commands require approval.

Without those boundaries, a capable model can still make a bad operational decision. It might change an unrelated module, keep trying an expensive tool call, or treat a successful command as proof that the user-facing workflow is correct.

## Four controls I would prioritize

1. **Permissions:** Start with the minimum access needed for the job.
2. **Checkpoints:** Persist progress so a failed process does not lose the entire task history.
3. **Limits:** Bound time, retries, tool calls, and spending.
4. **Verification:** Run relevant checks and report what was not tested.

For irreversible actions, require explicit approval. A model's interpretation of a document should not become permission to delete data, publish material, or send a message.

## Memory is also an application concern

If an agent writes notes or retains context across tasks, decide what belongs there. Keep secrets out, record provenance, and make stale instructions easy to identify. Persistent files do not automatically become trustworthy just because a model created them.

The practical lesson is that better models make stronger agent workflows possible. Reliability still comes from the system around them: clear ownership, constrained tools, measurable outcomes, and a person able to review the result.
