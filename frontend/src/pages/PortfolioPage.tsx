import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  GraduationCap,
  Briefcase,
  Code2,
  BookOpen,
  Award,
  ExternalLink,
  Download,
  Mail,
  Sparkles,
  Send,
  CheckCircle2,
  FileText,
  Cpu,
  Layers,
  Terminal,
  Globe,
  Share2,
} from "lucide-react";

export const PortfolioPage: React.FC = () => {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setIsSent(false);
    }, 4000);
  };

  const handleDownloadResume = () => {
    // Generate and download a formatted resume markdown / text file
    const resumeText = `# GUDEPU RAKSHITHA REDDY
Bengaluru, Karnataka, India | gudepurakshithareddy@gmail.com
LinkedIn: linkedin.com/in/gudepu-rakshitha-reddy-516aa72a9 | GitHub: github.com/GudepuRakshithaReddy
ResearchGate: researchgate.net/profile/Rakshitha-Reddy-Gudepu | HuggingFace: huggingface.co/GudepuRakshithaReddy

==================================================
PROFESSIONAL SUMMARY
==================================================
AI/ML Engineer, Full-Stack Developer, and Academic Researcher specializing in Generative AI, Retrieval-Augmented Generation (RAG), Natural Language Processing, and Computer Vision. Proven track record in developing empirical diagnostic platforms, multimodal content summarizers, and enterprise microservices.

==================================================
EDUCATION
==================================================
Alliance University, Bengaluru, India
Bachelor of Technology (B.Tech) - Computer Science & Engineering
Specialization: Artificial Intelligence & Machine Learning (AI & ML)
CGPA: 9.12 / 10.00 | Honors Scholar

==================================================
TECHNICAL SKILLS
==================================================
- Programming Languages: Python, Java, TypeScript, JavaScript, SQL, C++
- AI / Machine Learning: PyTorch, TensorFlow, Hugging Face Transformers, Scikit-learn, OpenCV, LangChain, LlamaIndex, Dense Vector Embeddings (pgvector)
- Backend & Cloud: FastAPI, Spring Boot, Node.js, PostgreSQL, Docker, AWS, REST APIs
- Frontend & UI: React 19, Vite, Tailwind CSS, TanStack Query, Zustand, Recharts

==================================================
RESEARCH PUBLICATIONS
==================================================
1. "AI-Powered Personalized Career and Skill Recommendation Framework with NLP Integration"
   Published in 2026 International Conference on Machine Learning and Autonomous Systems (ICMLAS), IEEE.
2. "Universal Content Summarization System (UCSS): Real-time Multimodal Summarization with Computer Vision and Large Language Models"
   Alliance University Department of Computer Science & Engineering.

==================================================
FEATURED PROJECTS
==================================================
- GapFinder AI: Grounded academic knowledge-gap diagnostic platform with Bayesian mastery modeling and adaptive revision scheduling.
- Universal Content Summarization System (UCSS): Multimodal summarization engine powered by Gemini Vision and OCR.
- QR Code Phishing & Scam Detector: ML-based URL safety classifier with feature extraction.
- Deepfake Video Detection Engine: Spatio-temporal CNN for facial manipulation detection.

==================================================
CERTIFICATIONS & HONORS
==================================================
- AWS Certified: Generative AI with Large Language Models
- IBM Certified: Machine Learning with Python
- IBM Certified: Agile Product Owner
- The Linux Foundation: Ethics in Artificial Intelligence
`;

    const blob = new Blob([resumeText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Gudepu_Rakshitha_Reddy_Resume.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const skills = [
    { category: "Artificial Intelligence & RAG", items: ["Retrieval-Augmented Gen (RAG)", "pgvector / Vector Search", "LangChain & LlamaIndex", "PyTorch & TensorFlow", "Hugging Face Transformers", "Computer Vision (OpenCV)"] },
    { category: "Backend Architecture", items: ["Python (FastAPI, Flask)", "Java (Spring Boot)", "PostgreSQL & SQLite", "SQLAlchemy ORM", "Docker & Microservices", "JWT & Argon2 Security"] },
    { category: "Frontend Engineering", items: ["React 19 & TypeScript", "Tailwind CSS v4", "Zustand State Store", "TanStack Query", "Recharts Data Viz", "Framer Motion"] },
    { category: "Tools & Methodologies", items: ["Git & GitHub Actions", "Alembic Migrations", "Linux / Bash Scripting", "Agile & Scrum (IBM Cert)", "Test-Driven Dev (pytest)", "RESTful API Design"] },
  ];

  const projects = [
    {
      title: "GapFinder AI",
      tagline: "AI Academic Diagnostic Platform & Adaptive Revision Engine",
      tech: ["FastAPI", "React 19", "pgvector", "Gemini 1.5", "Tailwind CSS"],
      desc: "Architected a proactive knowledge-gap diagnostic platform that constructs syllabus topic maps, generates grounded quizzes, diagnoses cognitive misconceptions, and dynamically calculates adaptive daily revision schedules using empirical Bayesian mastery formulas.",
      metrics: "Sub-second vector retrieval • 100% citation grounding • 0 hallucinated sources",
    },
    {
      title: "Universal Content Summarization System (UCSS)",
      tagline: "Multimodal Real-Time Document & Media Distillation",
      tech: ["Python", "Computer Vision", "OCR", "Multimodal LLMs", "Streamlit"],
      desc: "Developed an automated multimodal summarization pipeline integrating OCR, visual scene analysis, and generative models to digest complex textbook chapters, infographics, and research papers into structured executive briefings.",
      metrics: "94.6% semantic retention • Real-time OCR parsing across complex PDFs",
    },
    {
      title: "QR Code Scam & Phishing Detector",
      tagline: "Machine Learning Threat Classifier for Malicious Payloads",
      tech: ["Python", "Scikit-learn", "Cybersecurity", "FastAPI"],
      desc: "Trained an ensemble classifier to detect suspicious URL patterns, credential harvesting vectors, and evasive redirects embedded inside physical QR codes.",
      metrics: "97.8% validation accuracy on 20,000+ benchmark dataset",
    },
    {
      title: "Deepfake Video Detection Engine",
      tagline: "Deep Convolutional Neural Network for Facial Tampering",
      tech: ["PyTorch", "OpenCV", "ResNet / EfficientNet", "Flask"],
      desc: "Implemented a frame-by-frame temporal and spatial feature extraction pipeline to detect synthetic facial manipulation, identity swapping, and artifact inconsistencies in video feeds.",
      metrics: "Tested against FaceForensics++ benchmark",
    },
  ];

  const publications = [
    {
      title: "AI-Powered Personalized Career and Skill Recommendation Framework with NLP Integration",
      venue: "2026 International Conference on Machine Learning and Autonomous Systems (ICMLAS), IEEE",
      pages: "pp. 437–443",
      abstract: "Presents a novel natural language processing framework that parses student academic transcripts, models skill gaps against real-time industry job vectors, and constructs personalized learning trajectories.",
      link: "https://www.researchgate.net/profile/Rakshitha-Reddy-Gudepu",
    },
    {
      title: "Universal Content Summarization System (UCSS): Real-Time Multimodal Distillation",
      venue: "Department of Computer Science & Engineering, Alliance University",
      pages: "Research Monograph",
      abstract: "Investigates zero-shot multimodal summarization architectures incorporating attention-guided vision backbones and grounded LLM synthesis for academic technical literature.",
      link: "https://medium.com",
    },
  ];

  const certifications = [
    { name: "Generative AI with Large Language Models", issuer: "Amazon Web Services (AWS)", date: "2024" },
    { name: "Machine Learning with Python", issuer: "IBM Professional Certification", date: "2024" },
    { name: "Certified Agile Product Owner", issuer: "IBM", date: "2024" },
    { name: "Ethics in Artificial Intelligence", issuer: "The Linux Foundation", date: "2023" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in py-6 px-2 sm:px-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 dark:from-[#0d121f] dark:via-[#090d16] dark:to-amber-950/20 border border-amber-500/20 dark:border-slate-800 shadow-xl transition-all">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Lead Architect & AI Engineer</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Gudepu Rakshitha Reddy
              </h1>
              <p className="text-base sm:text-lg text-amber-700 dark:text-amber-400 font-semibold mt-1">
                Computer Science & Engineering (AI & ML) • Alliance University
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              Passionate AI/ML Engineer, Full-Stack Developer, and Published Researcher. Dedicated to engineering grounded, empirical artificial intelligence systems—from production RAG vector architectures to intelligent diagnostic learning loops.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleDownloadResume}
                className="flex items-center gap-2 shadow-md hover:scale-105 transition-transform"
              >
                <Download className="w-4 h-4" />
                Download Curriculum Vitae
              </Button>
              <a href="#contact">
                <Button variant="outline" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Get in Touch
                </Button>
              </a>
            </div>
          </div>

          {/* Profile Card / Highlights */}
          <div className="w-full md:w-80 shrink-0 p-6 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm">
                GR
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Alliance University</span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Bengaluru, India</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Degree</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">B.Tech in CSE (AIML)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Cumulative GPA</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">9.12 / 10.00</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Specialization</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">GenAI, RAG & NLP</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <Badge variant="success" dot>Available for Roles</Badge>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <a
                href="https://github.com/GudepuRakshithaReddy"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/gudepu-rakshitha-reddy-516aa72a9"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
              <a
                href="https://www.researchgate.net/profile/Rakshitha-Reddy-Gudepu"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="ResearchGate"
              >
                <BookOpen className="w-4 h-4" />
              </a>
              <a
                href="https://huggingface.co/GudepuRakshithaReddy"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Hugging Face"
              >
                <Cpu className="w-4 h-4" />
              </a>
              <a
                href="https://dev.to/gudepurakshithareddy"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Technical Blog"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Education & Academic Excellence */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Education & Academic Excellence</h2>
        </div>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Alliance University</h3>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Bachelor of Technology in Computer Science & Engineering (Specialization: AI & ML)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bengaluru, Karnataka, India • 2022 – 2026</p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <Badge variant="success" dot>CGPA: 9.12 / 10.00</Badge>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Honors Merit Standing</span>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Key Coursework</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Data Structures & Algorithms, Deep Learning, Natural Language Processing, Database Management Systems, Distributed Computing, Computer Vision.
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Academic Honors</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Consistently ranked in the top percentile of the department. Recipient of University Academic Excellence recognition for AIML project demonstrations.
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Extracurriculars & Leadership</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Active technical mentor for junior engineering batches, organizing AI hackathons, and presenting peer study seminars on generative models.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Technical Skill Matrix */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Technical Skill Matrix</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((s, idx) => (
            <Card key={idx} className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {s.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {s.items.map((item, iIdx) => (
                  <span
                    key={iIdx}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Code2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Featured Engineering Projects</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj, pIdx) => (
            <Card key={pIdx} className="p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{proj.title}</h3>
                  <Badge variant="amber">Featured</Badge>
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block mb-3">
                  {proj.tagline}
                </span>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  {proj.desc}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap gap-1.5">
                  {proj.tech.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ {proj.metrics}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Research Publications */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Peer-Reviewed Research Publications</h2>
        </div>

        <div className="space-y-4">
          {publications.map((pub, idx) => (
            <Card key={idx} className="p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{pub.title}</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                    {pub.venue} • {pub.pages}
                  </p>
                </div>
                <a
                  href={pub.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                >
                  <span>Read Paper</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {pub.abstract}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Certifications & Industry Credentials */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Certifications & Credentials</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {certifications.map((c, idx) => (
            <Card key={idx} className="p-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{c.name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.issuer}</p>
              </div>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-2 block">
                Issued {c.date}
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* Professional Experience & Internships */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Professional Experience & Internships</h2>
        </div>

        <div className="space-y-4">
          <Card className="p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">AI/ML Developer Intern</h3>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Bengaluru, India</span>
              </div>
              <Badge variant="outline">2023 – 2024</Badge>
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Engineered high-throughput data extraction and OCR parsing pipelines converting unstructured institutional documents into vectorized knowledge bases.</li>
              <li>Collaborated on fine-tuning Transformer-based classification models for automated content indexing and metadata enrichment.</li>
              <li>Participated in cross-functional Agile sprints, daily standups, and unit test suites maintaining 95%+ code coverage.</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Get in Touch</h2>
        </div>

        <Card className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Let's Build Grounded AI Together</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                Whether you're interested in research collaborations, enterprise RAG architectures, full-stack machine learning engineering, or software roles, feel free to reach out directly.
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-mono">gudepurakshithareddy@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <svg className="w-4 h-4 fill-current text-amber-600 dark:text-amber-400 shrink-0" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <a
                    href="https://www.linkedin.com/in/gudepu-rakshitha-reddy-516aa72a9"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-amber-600 dark:text-amber-400"
                  >
                    linkedin.com/in/gudepu-rakshitha-reddy
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <svg className="w-4 h-4 fill-current text-amber-600 dark:text-amber-400 shrink-0" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <a
                    href="https://github.com/GudepuRakshithaReddy"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-amber-600 dark:text-amber-400"
                  >
                    github.com/GudepuRakshithaReddy
                  </a>
                </div>
              </div>
            </div>

            {/* Interactive Form */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              {isSent && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Thank you! Your message has been received.</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Dr. Alex Mercer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="alex.mercer@institution.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Discuss research, hiring, or technical collaborations..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </Button>
            </form>
          </div>
        </Card>
      </section>

      {/* Professional Footer */}
      <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Designed & Engineered by Gudepu Rakshitha Reddy
        </p>
        <p className="text-[11px]">
          GapFinder AI • Empirical Academic Diagnostic Platform • Alliance University, Bengaluru
        </p>
      </footer>
    </div>
  );
};