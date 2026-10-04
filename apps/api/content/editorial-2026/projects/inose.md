### Signal quality before classification

i-Nose C-19 is an electronic-nose research project associated with preliminary COVID-19 screening through underarm sweat odor. My published work focused on a narrower technical problem: detecting outliers in the electronic-nose signal data.

The university report describes the wider device initiative. The research paper supports the adaptive filtering method and its evaluation; the two should not be treated as identical claims.

### Adaptive deep-learning filter

The method used a deep neural network with self-feature extraction to distinguish outlying observations in the collected signal data. The objective was to improve the quality of the data entering later analysis, rather than treating every sensor observation as equally reliable.

The research compared the adaptive approach with SVM, Naive Bayes, k-nearest neighbors, Random Forest, XGBoost, and an Euclidean-distance/z-score approach. Comparing several baselines helps clarify whether a more complex model adds value to the specific filtering task.

### Pipeline responsibilities

The engineering work connected signal processing, feature extraction, training experiments, and model evaluation. Python and TensorFlow supported the machine-learning workflow, with NumPy and scikit-learn in the broader project stack.

The project also explored embedded/edge tooling, including TensorFlow Lite and Raspberry Pi. The published result cited here does not establish a Raspberry Pi latency measurement or a deployed clinical diagnostic system, so neither is presented as an outcome.

### What the result means

The paper reports **90.4% average balanced accuracy for outlier detection**. This is not 90.4% COVID-19 diagnostic accuracy. Outlier detection and disease classification are different tasks, with different labels, validation requirements, and practical consequences.

As first author, I contributed to the method design, preprocessing and feature-extraction workflow, model training, comparisons, evaluation, and research writing.

The work was published as *Adaptive filter for detection outlier data on electronic nose signal* in Elsevier's *Sensing and Bio-Sensing Research*, volume 36, article 100492 (2022). The linked paper is the authoritative source for the method and reported metric.

The retained workflow illustration is a visual reference, not evidence for its depicted sample-collection method or diagnostic output. The written case study and cited paper define the scope of this work.
