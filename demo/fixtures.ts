import { Application, FollowUp, createEmptyState } from "../domain/types";

// Fictional demo data only. These companies and contacts are invented for the demo.
export const DEMO_APPLICATIONS: Application[] = [
  {
    id: "demo-app-1",
    company: "Northstar Fictional Systems (Demo)",
    role: "Frontend Engineer",
    postingUrl: "https://example.com/jobs/northstar-frontend",
    stage: "interview",
    appliedDate: "2026-09-15",
    notes: "Fictional demo record. First-round interview scheduled.",
    createdAt: "2026-09-10T09:00:00.000Z",
    updatedAt: "2026-09-28T10:00:00.000Z",
  },
  {
    id: "demo-app-2",
    company: "Aurora Imaginary Cloud (Demo)",
    role: "Full Stack Developer",
    postingUrl: "https://example.com/jobs/aurora-fullstack",
    stage: "applied",
    appliedDate: "2026-09-20",
    notes: "Fictional demo record. Awaiting response.",
    createdAt: "2026-09-18T09:00:00.000Z",
    updatedAt: "2026-09-20T09:00:00.000Z",
  },
  {
    id: "demo-app-3",
    company: "Brightwell Mock Labs (Demo)",
    role: "Software Engineer",
    postingUrl: null,
    stage: "saved",
    appliedDate: null,
    notes: "Fictional demo record. Not yet submitted.",
    createdAt: "2026-09-25T09:00:00.000Z",
    updatedAt: "2026-09-25T09:00:00.000Z",
  },
  {
    id: "demo-app-4",
    company: "Cobalt Sample Robotics (Demo)",
    role: "UI Engineer",
    postingUrl: "https://example.com/jobs/cobalt-ui",
    stage: "screening",
    appliedDate: "2026-09-12",
    notes: "Fictional demo record. Recruiter screen completed.",
    createdAt: "2026-09-08T09:00:00.000Z",
    updatedAt: "2026-09-22T09:00:00.000Z",
  },
  {
    id: "demo-app-5",
    company: "Delta Example Analytics (Demo)",
    role: "Data Visualization Engineer",
    postingUrl: "https://example.com/jobs/delta-viz",
    stage: "rejected",
    appliedDate: "2026-09-05",
    notes: "Fictional demo record. Rejected after interview.",
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-30T09:00:00.000Z",
  },
  {
    id: "demo-app-6",
    company: "Evergreen Testworks (Demo)",
    role: "Platform Engineer",
    postingUrl: "https://example.com/jobs/evergreen-platform",
    stage: "offer",
    appliedDate: "2026-08-30",
    notes: "Fictional demo record. Offer received; numbers are illustrative.",
    createdAt: "2026-08-25T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
  },
];

export const DEMO_FOLLOWUPS: FollowUp[] = [
  {
    id: "demo-followup-1",
    applicationId: "demo-app-1",
    dueDate: "2026-09-29",
    completedAt: null,
    notes: "Fictional demo follow-up. Send thank-you note.",
    createdAt: "2026-09-28T10:00:00.000Z",
  },
  {
    id: "demo-followup-2",
    applicationId: "demo-app-2",
    dueDate: "2026-10-20",
    completedAt: null,
    notes: "Fictional demo follow-up. Check status email.",
    createdAt: "2026-09-20T09:00:00.000Z",
  },
  {
    id: "demo-followup-3",
    applicationId: "demo-app-5",
    dueDate: "2026-09-28",
    completedAt: "2026-09-29T08:00:00.000Z",
    notes: "Fictional demo follow-up. Closed loop.",
    createdAt: "2026-09-27T09:00:00.000Z",
  },
];

export const createDemoState = () => {
  const base = createEmptyState();
  return {
    ...base,
    applications: DEMO_APPLICATIONS.map((a) => ({ ...a })),
    followUps: DEMO_FOLLOWUPS.map((f) => ({ ...f })),
    stageEvents: [],
  };
};