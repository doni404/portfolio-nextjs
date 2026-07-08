# Seed Plan: Portfolio Website

## Purpose

Seed the PostgreSQL database with enough content to launch the portfolio website and blog without manual database work.

## Command

Recommended command once the backend is implemented:

```bash
pnpm db:seed
```

Recommended Prisma package script:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Behavior

- Seed script should be idempotent.
- Use stable slugs and unique keys for upserts.
- Use Prisma `upsert` for authors, categories, tags, projects, posts, and site assets.
- Do not overwrite production-edited content unless an explicit reset flag is passed.
- Create published sample content for local development.
- Create pending and approved comments only in local/development seed mode.

## Author

- Name: Doni Putra Purbawa
- Slug: `doni-putra-purbawa`
- Title: Senior Backend Engineer
- Email: `doniputrapurbawa@gmail.com`
- Website: `https://doniputra.com`
- LinkedIn: `https://linkedin.com/in/doniputra`

## Categories

- Backend Engineering: `backend-engineering`
- Cloud & DevOps: `cloud-devops`
- Payment Systems: `payment-systems`
- AI & LLM: `ai-llm`
- Machine Learning: `machine-learning`
- Career & Japan: `career-japan`
- Tutorials: `tutorials`

## Tags

- `golang`
- `nodejs`
- `java`
- `python`
- `aws`
- `docker`
- `postgresql`
- `redis`
- `grpc`
- `rest-api`
- `stripe`
- `paypal`
- `gmo`
- `square`
- `openai`
- `gemini`
- `tensorflow`
- `system-design`

## Experiences

- Backend Engineering Manager (Hands-on), Gloding, Inc., Japan, Jan 2020 - Present
- Cloud Solution Architect (Hands-on), Gloding, Inc., Japan, Jan 2018 - Jan 2020
- Backend Developer, Gloding, Inc., Japan, Oct 2017 - Jan 2018
- Machine Learning Engineer (Contract), PT. Hikari Solusindo Sukses, Indonesia, Aug 2021 - Dec 2021

## Projects

- Payment Gateway & Subscription Platform
- Scalable Backend Microservices on AWS
- AI Chatbot & Recommendation Backend
- i-Nose C-19 ML Model

## Starter Blog Posts

- Designing Reliable Payment Webhooks for Production Systems
- How I Structure Backend Services with Microservices and gRPC
- Practical AWS Architecture for Small Engineering Teams
- Building AI Chatbots with LLM APIs in Backend Systems
- Lessons from Deep Learning Anomaly Detection on Sensor Data

## Skills

- Languages: Golang, JavaScript (Node.js), Python, Java
- Cloud & Infrastructure: AWS, Linux, Docker
- Backend & Architecture: REST API, Microservices, gRPC, System Design
- Payment Integration: Stripe, PayPal, GMO, Square
- Databases: MySQL, PostgreSQL, Redis, Qdrant
- Tools: Git, GitHub Actions, Jira, Bash
- AI & Machine Learning: OpenAI, Gemini, TensorFlow

## Certifications

- JLPT N4, Japan Foundation, score 106 / 180, issued 2025-07
- AWS Certified Cloud Practitioner, Amazon Web Services, 2026
- TOEIC, International Test Center, score 765, issued 2019-09

## Education

- Master of Informatics Engineering, Institut Teknologi Sepuluh Nopember, 2020 - 2022, GPA 4.00/4.00
- Bachelor of Informatics Engineering, Brawijaya University, 2014 - 2019, GPA 3.79/4.00
- Student Exchange Program, Saga University, 2018

## Site Assets

- `cv_pdf`: CV PDF download URL.
- `profile_image`: profile image URL or placeholder.
- `default_og_image`: default Open Graph image URL.

## Admin User

- Email: `doniputrapurbawa@gmail.com`
- Name: Doni Putra Purbawa
- Role: `owner`
- Password source: `ADMIN_SEED_PASSWORD` environment variable.

Never hardcode the admin password in seed files or documentation.
