Choosing an AI model is also choosing who runs it, where data goes, and who handles the operational work. Llama 3.1 made that conversation more visible in 2024.

## The release in context

Meta released Llama 3.1 on July 23, 2024. Its model card describes text models in 8B, 70B, and 405B sizes, a 128K context length, and multilingual support. The models use the Llama 3.1 Community License, a custom license with its own conditions. Open weights should not be mistaken for unrestricted licensing. [Meta's model card](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md) is the useful place to verify release scope and limitations.

## Managed API or self-hosted model?

With a managed API, a provider handles much of the inference infrastructure. Your team still owns integration, data handling, error recovery, and cost controls.

With self-hosted weights, you can gain more control over deployment location and configuration. You also take on capacity planning, patching, model serving, monitoring, and availability. A downloadable model is not a free production service.

For an illustrative internal assistant, private hosting might be useful when the organization has strict data-location requirements and a team capable of operating it. For a small product with uneven traffic, a managed route may be easier to support. Neither choice is universally better.

## Compare on the job, not the biggest number

A larger model may need substantially more resources. A smaller model may be sufficient for a constrained task. Evaluate with the actual inputs, languages, and output requirements your users have.

Include invalid requests and questions outside the available information. Measure how often a model produces an acceptable answer, not just how fluent the response sounds.

## The takeaway

Open weights widen the set of architectural choices. The professional decision still involves licensing, privacy, operating cost, and evidence of task performance.

My recommendation is to treat model hosting as an infrastructure decision with an evaluation attached. Do not assume local deployment alone makes a system private, secure, or economical.
