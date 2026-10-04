Sensor machine learning starts before the neural network. The input is a physical measurement, and a change in the measurement process can look like a change in the thing you are trying to predict.

My i-Nose research focused on the quality of electronic-nose signals: identifying observations that should not be treated as trustworthy input to a downstream model.

## Separate the device, the task, and the claim

An electronic nose measures responses across a sensor array. In the i-Nose research context, underarm-sweat odor was investigated for respiratory-infection screening.

The [university's project report](https://www.its.ac.id/news/en/its-develops-i-nose-c-19-covid-19-detector-through-underarm-sweat-odor/) describes the wider initiative. My [published paper](https://doi.org/10.1016/j.sbsr.2022.100492) addresses a narrower task: detecting outlier observations in electronic-nose signals with an adaptive filter using a deep neural network and self-feature extraction.

That distinction matters. Outlier-detection performance is not the same as clinical diagnostic accuracy, and research performance alone does not establish clinical readiness.

## Inspect the signal before changing the model

Plot individual channels and inspect how they change across measurements. Look for missing readings, unusual ranges, abrupt transitions, and acquisition conditions that could explain them.

Do not automatically delete every unusual point. An uncommon observation may be valid. A useful quality-control pipeline distinguishes suspicious data from data that is simply rare.

Keep an audit trail of preprocessing decisions. When an observation is excluded or flagged, record the reason and preserve the original measurement. This makes later analysis reproducible.

## Compare with a real baseline

A more complex model should demonstrate an advantage over simpler alternatives. The paper compares the adaptive DNN approach with SVM, Naive Bayes, k-NN, Random Forest, XGBoost, and an Euclidean z-score baseline.

The reported result was **90.4% average balanced accuracy for outlier detection**. It was not a 94% COVID classification result, and the paper does not support a claimed sub-200 ms Raspberry Pi diagnostic benchmark.

Keep the evaluation task attached to the number whenever you communicate the result. A memorable percentage without its definition can tell the wrong story.

## Split data according to how it is collected

As a general engineering practice, design evaluation around the independence you expect at deployment. If several measurements share a subject, session, or acquisition setup, consider whether random row splitting lets closely related examples appear on both sides of the evaluation.

This is a recommendation for future pipelines, not a claim about the exact protocol in the published experiment. State the split policy and the limits of the available dataset rather than implying broad generalization from one result.

## Real-time use needs a system-level test

The paper describes the approach as applicable to real-time outlier detection. A deployed pipeline still needs separate measurements of acquisition time, preprocessing cost, inference latency, memory use, and behavior when signals are incomplete.

When optimizing a model for a smaller device, re-evaluate the model after conversion. A smaller artifact is not useful if it changes the quality-control behavior in ways that matter.

## The lesson I carry into other ML work

Treat measurement quality, evaluation design, and operational constraints as first-class parts of the system. Model architecture is only one piece.

The practical outcome of this research is a clearer way to reason about signal quality and a peer-reviewed account of one adaptive filtering method. Its limits are part of the result, not something to hide.
