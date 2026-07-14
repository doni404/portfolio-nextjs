UPDATE "projects"
SET
  "problem" = 'Electronic nose signals from underarm sweat can contain invalid or anomalous observations that reduce data quality and make downstream respiratory-infection screening less reliable.',
  "solution" = 'Developed an adaptive filtering approach that combines a deep neural network with self-feature extraction to detect outliers in electronic-nose signals. Compared the method with SVM, Naive Bayes, k-NN, Random Forest, XGBoost, and Euclidean z-score baselines, with a focus on real-time use.',
  "role" = 'First author and Machine Learning Engineer - contributed to the signal-processing and machine-learning design, feature extraction, model training and evaluation, comparative analysis, and research publication.',
  "outcome" = 'The adaptive DNN with self-feature extraction achieved 90.4% average balanced accuracy for outlier detection and outperformed the evaluated baseline methods. The approach was designed to support real-time electronic-nose filtering and improve downstream screening performance. Published in the peer-reviewed Elsevier journal Sensing and Bio-Sensing Research, Volume 36, Article 100492 (2022).'
WHERE "slug" = 'i-nose-c19-ml-model';
