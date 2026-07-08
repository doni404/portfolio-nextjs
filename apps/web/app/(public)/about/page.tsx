import type { Metadata } from "next";
import { Download, MapPin, BookOpen, Award, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Doni Putra Purbawa — Senior Backend Engineer with expertise in fintech, cloud infrastructure, and AI systems.",
};

const skills = [
  {
    group: "Languages",
    items: ["Node.js", "TypeScript", "Java", "Golang", "Python"],
  },
  {
    group: "Cloud & Infrastructure",
    items: ["AWS EC2", "RDS", "S3", "CloudFront", "IAM", "CloudWatch", "Docker", "Nginx"],
  },
  {
    group: "Backend & Architecture",
    items: ["REST API", "gRPC", "Microservices", "PostgreSQL", "Redis", "RabbitMQ", "AWS SQS"],
  },
  {
    group: "Payment Integration",
    items: ["Stripe", "PayPal", "GMO", "Square", "Webhooks", "Subscription Billing"],
  },
  {
    group: "AI & Machine Learning",
    items: ["OpenAI", "Gemini", "LangChain", "TensorFlow", "PyTorch", "Vector Databases"],
  },
  {
    group: "Tools & Practices",
    items: ["GitHub Actions", "PM2", "Linux", "Prisma", "Zod", "Jest"],
  },
];

const certifications = [
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    year: "2023",
    color: "yellow",
  },
  {
    name: "JLPT N4 (Japanese Language)",
    issuer: "Japan Foundation",
    year: "2019",
    color: "blue",
  },
  {
    name: "TOEIC 765 (English Proficiency)",
    issuer: "ETS",
    year: "2022",
    color: "green",
  },
] as const;

const education = [
  {
    degree: "Master of Informatics Engineering",
    institution: "Institut Teknologi Sepuluh Nopember (ITS)",
    location: "Surabaya, Indonesia",
    period: "2020 – 2022",
    gpa: "GPA 4.00 / 4.00",
    highlights: [
      "Research focus: Deep learning for anomaly detection in medical IoT",
      "Published Elsevier Q1 journal paper on COVID-19 detection",
      "Co-authored book: Machine Learning & Deep Learning using Python",
    ],
  },
  {
    degree: "Bachelor of Informatics Engineering",
    institution: "Universitas Brawijaya",
    location: "Malang, Indonesia",
    period: "2013 – 2017",
    gpa: "GPA 3.79 / 4.00",
    highlights: [
      "Student exchange at Saga University, Japan (2016)",
      "Thesis: Web-based academic information system",
    ],
  },
  {
    degree: "Student Exchange Program",
    institution: "Saga University",
    location: "Saga, Japan",
    period: "2016",
    highlights: [
      "Immersed in Japanese engineering and academic culture",
      "Foundation for JLPT N4 language achievement",
      "Sparked interest in Japan technology sector and career opportunities",
    ],
  },
];

const publications = [
  {
    title: "Deep Learning-Based Anomaly Detection for i-Nose C-19 Electronic Nose System",
    journal: "Heliyon (Elsevier) — Q1 Journal",
    year: "2022",
    description:
      "Classification of COVID-19 exhaled breath biomarkers using CNN-LSTM hybrid model trained on MOS sensor time-series data. Achieved 94% accuracy on held-out test set.",
  },
  {
    title: "Machine Learning & Deep Learning using Python",
    journal: "Book — Co-author",
    year: "2022",
    description:
      "Contributed chapters covering deep learning fundamentals, model training workflows, and practical deployment patterns for Indonesian engineering students.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
            <div className="flex-shrink-0">
              <img
                src="/profile.png"
                alt="Doni Putra Purbawa"
                className="h-24 w-24 rounded-2xl object-cover shadow-lg ring-2 ring-blue-100"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Doni Putra Purbawa
              </h1>
              <p className="mt-1 text-lg font-medium text-blue-600">Senior Backend Engineer</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Indonesia · Open to Japan relocation
                </span>
              </div>
              <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
                I&apos;m a hands-on backend engineering manager with 6+ years building production
                systems for a Japanese SaaS company. My expertise spans fintech payment
                integrations, AWS cloud infrastructure, microservices architecture, and AI-powered
                application backends. I care about correctness, reliability, and shipping things
                that work.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="/files/doni-putra-purbawa-cv.pdf"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" /> Download CV
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-12">
          {/* Engineering Philosophy */}
          <section>
            <h2 className="mb-6 text-xl font-bold text-slate-900">Engineering Philosophy</h2>
            <Card>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Good backend engineering is invisible — your users never think about the systems
                  keeping their data safe, their payments processing, and their features available.
                  That invisibility is the goal.
                </p>
                <p>
                  I approach every system with three questions: Is it correct? Is it observable?
                  Can someone else maintain it in six months? The answer to all three should be yes
                  before anything goes to production.
                </p>
                <p>
                  I believe in simple solutions to complex problems, strong code review culture,
                  incident postmortems without blame, and continuous investment in developer
                  tooling and deployment confidence.
                </p>
              </div>
            </Card>
          </section>

          {/* Skills */}
          <section>
            <h2 className="mb-6 text-xl font-bold text-slate-900">Technical Skills</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {skills.map(({ group, items }) => (
                <Card key={group}>
                  <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    {group}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Badge key={item} variant="blue">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Certifications */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-900">
              <Award className="h-5 w-5 text-blue-600" /> Certifications
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {certifications.map((cert) => (
                <Card key={cert.name} className="border-slate-200">
                  <div className="mb-2">
                    <Badge
                      variant={cert.color as "yellow" | "blue" | "green"}
                      className="mb-3"
                    >
                      {cert.year}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                    {cert.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{cert.issuer}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Education */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-900">
              <GraduationCap className="h-5 w-5 text-blue-600" /> Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <Card key={edu.degree}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{edu.degree}</h3>
                      <p className="text-sm text-blue-600">{edu.institution}</p>
                      <p className="text-xs text-slate-500">{edu.location}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-700">{edu.period}</span>
                      {edu.gpa && (
                        <p className="text-xs font-semibold text-emerald-600">{edu.gpa}</p>
                      )}
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {edu.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </section>

          {/* Publications */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-900">
              <BookOpen className="h-5 w-5 text-blue-600" /> Publications & Books
            </h2>
            <div className="space-y-4">
              {publications.map((pub) => (
                <Card key={pub.title}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug max-w-lg">
                      {pub.title}
                    </h3>
                    <Badge variant="green" className="w-fit flex-shrink-0">
                      {pub.year}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs font-medium text-blue-600">{pub.journal}</p>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{pub.description}</p>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
