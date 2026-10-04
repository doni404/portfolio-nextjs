### A phased proof of concept

The Kawaijuku learning-platform proposal explored how an AI-assisted lecture experience could help students ask questions, check their understanding, and receive a useful explanation without waiting for the next instructor interaction.

This case study describes a PoC architecture and evaluation plan. Production-scale delivery was a follow-on phase, not a completed result.

### Learning loop

1. Prepare and structure lecture content for the learning experience.
2. Let a student ask a question in the context of the lecture.
3. Use an AI question-answering service to produce a relevant explanation.
4. Present an instructor-authored or generated knowledge checkpoint.
5. Record the interaction and progress in learning history.
6. Use that history to support follow-up learning and administrative review.

An AI tutor avatar was part of the proposed experience. Its purpose was to support communication, not to replace the underlying content, evaluation, or backend controls.

### Architecture responsibilities

The plan separated content preparation, model/API integration, application services, student UI, and history management. That boundary makes it possible to compare AI providers without tying the entire learning workflow to a single model.

- **AI integration:** compare model and API behavior against representative lecture questions.
- **Backend APIs:** coordinate questions, explanations, checkpoints, and error handling.
- **Persistence:** use PostgreSQL for the application's structured learning and history data.
- **Student interface:** provide a responsive web experience for questions and progress.
- **Administration:** review history and manage the operational learning workflow.
- **Cloud deployment:** plan the AWS environment and service integration boundaries.

OpenAI API and Google Cloud AI were included in the evaluation stack. Their presence in the proposal does not imply that both were deployed simultaneously in production.

### Evaluation before scale

The four-phase, ten-month plan covered model research, real-time Q&A, checkpoint generation, the student interface, history and administration, pilot evaluation, and tuning.

The stated success criteria targeted at least 80% question-answering accuracy and responses within ten seconds, alongside a smooth interactive experience. These are acceptance targets, not measured results. A pilot would need an agreed question set, scoring criteria, timing measurements, and a review of incorrect or incomplete answers before any production claim could be made.

The technical contribution focused on cloud/backend architecture, AI integration boundaries, data flows, API error handling, and an operational plan for an extensible educational platform.
