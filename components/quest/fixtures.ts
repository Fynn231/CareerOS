import type { Encounter } from './model';
export const encounters: Encounter[] = [
  {
    id: 'cloud-warden', title: 'Junior Cloud Developer', employer: 'Nimbus Harbor · fictional', category: 'Heroes', track: 'Cloud / development', location: 'Remote · US demo',
    summary: 'Keep a small cloud service steady as it grows. Turn a well-scoped feature into a tested, observable release.',
    reasons: ['AWS Certified Developer Associate connects directly to the cloud-development theme.', 'Information Science provides an academic connection to information systems; it does not establish production experience.'],
    gaps: ['Build a small deployed-service portfolio with tests and documented rollback steps.', 'Practice permissions, logging, and failure recovery in a local simulation.'],
    mission: 'In this fictional team, pair with a senior engineer to design one service endpoint, review access boundaries, and explain how you would detect a failed release.',
  },
  {
    id: 'signal-reader', title: 'Data Analyst', employer: 'Lantern Metrics · fictional', category: 'Heroes', track: 'Analytics / information', location: 'Hybrid · Boston demo',
    summary: 'Make a messy operational question legible. Trace a metric from raw records to a clear decision.',
    reasons: ['Information Science is a relevant academic starting point for organizing and interpreting information.', 'Your confirmed profile does not establish SQL, Python, or professional analytics experience.'],
    gaps: ['Create a small fictional dataset analysis with explicit assumptions and data-quality checks.', 'Develop and demonstrate SQL querying and a clear chart narrative.'],
    mission: 'Explore why a fictional service queue slows down. Define the question, check missing records, and present a short evidence-based recommendation.',
  },
  {
    id: 'security-keeper', title: 'Junior Security Analyst', employer: 'Bastion Grove · fictional', category: 'Heroes', track: 'Security / IT', location: 'On-site · Raleigh demo',
    summary: 'Read the signals, ask careful questions, and help a team investigate an unusual access event.',
    reasons: ['Security+ connects to foundational security concepts in this encounter.', 'AWS Certified Developer Associate offers a cloud-context connection, not proof of incident-response experience.'],
    gaps: ['Write a sample incident timeline using synthetic logs.', 'Practice alert triage and explain escalation boundaries in a local lab.'],
    mission: 'Use synthetic access logs to separate routine activity from an event needing escalation. Document your uncertainty and preserve a clear investigation trail.',
  },
  {
    id: 'product-scout', title: 'Technical Product Operations Analyst', employer: 'Waypoint Systems · fictional', category: 'Side quests', track: 'Product / operations', location: 'Remote · US demo',
    summary: 'Map the friction between a product team and the people using its tools. Make the next handoff clearer.',
    reasons: ['Information Science offers a connection to the way people, information, and systems interact.', 'This adjacent path would need evidence of product processes and stakeholder communication.'],
    gaps: ['Draft a concise product issue brief with a reproducible example.', 'Build a sample intake workflow and define useful operational measures.'],
    mission: 'Trace a fictional support request through intake, triage, and engineering. Propose one measurable process improvement without claiming it has shipped.',
  },
  {
    id: 'platform-compass', title: 'Solutions / Platform Analyst', employer: 'Meridian Toolworks · fictional', category: 'Side quests', track: 'Platform / systems', location: 'Hybrid · Chicago demo',
    summary: 'Translate a team’s workflow into practical platform requirements, then test the shape of a solution.',
    reasons: ['Your Information Science background connects to understanding systems and information needs.', 'AWS certification connects to cloud vocabulary; it does not establish solution-design experience.'],
    gaps: ['Diagram a fictional integration and document its failure cases.', 'Practice requirements discovery and write acceptance criteria for a small prototype.'],
    mission: 'Compare two fictional platform workflows. Explain access needs, integration boundaries, and what you would test before recommending a change.',
  },
  {
    id: 'orbital-backend', title: 'Backend Engineer', employer: 'Atlas Orbit Technologies · fictional mega-tech', category: 'Final bosses', track: 'Backend / distributed systems', location: 'Hybrid · Seattle demo',
    summary: 'An ambitious encounter with high-volume services, careful API contracts, and difficult failure modes.',
    reasons: ['AWS Certified Developer Associate connects to cloud-service concepts.', 'This authored stretch encounter needs substantial engineering evidence beyond the confirmed profile.'],
    gaps: ['Build and test an API with authentication, concurrency, and failure handling.', 'Practice data modeling, algorithms, and explaining distributed-system tradeoffs.'],
    mission: 'Design a fictional high-traffic task service. Explain idempotency, data consistency, observability, and a strategy for recovering from partial failures.',
  },
  {
    id: 'orbital-platform', title: 'Platform Engineer', employer: 'Helios Compute Collective · fictional mega-tech', category: 'Final bosses', track: 'Infrastructure / developer platforms', location: 'Remote · US demo',
    summary: 'Build the paved road other engineers rely on. A stretch challenge in reliability and developer tooling.',
    reasons: ['AWS Certified Developer Associate and Security+ connect to cloud and security foundations.', 'Neither credential demonstrates operating large-scale infrastructure; this is an ambitious practice direction.'],
    gaps: ['Create a reproducible infrastructure lab with least-privilege access.', 'Demonstrate monitoring, automated checks, and a written service-recovery exercise.'],
    mission: 'Outline a fictional internal deployment platform. Describe safe defaults, developer feedback, service ownership, and how you would validate recovery.',
  },
];
