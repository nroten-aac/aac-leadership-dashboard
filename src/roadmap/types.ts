// =============================================================
// AAC HIGH IMPACT ROADMAP · TYPESCRIPT TYPES
// =============================================================
// All data shapes for the AAC playbook + dashboard.
// Use these as the contract between PCO sync, Supabase, and React components.

// ---------- BASIC UNIONS ----------

export type Stage = 'connect' | 'belong' | 'mature' | 'minister' | 'multiply';

export type LawStatus = 'pending' | 'in-progress' | 'complete';

export type ActionSource = 'chip' | 'jim' | 'impl';

export type EngagementAbbr = 'LG' | 'BS' | 'PT' | 'DG' | 'SRV';

export type PhaseN = 1 | 2 | 3 | 4;

// ---------- STAGE METADATA ----------

export const STAGE_ORDER: Stage[] = ['connect', 'belong', 'mature', 'minister', 'multiply'];

export const STAGE_NAMES: Record<Stage, string> = {
  connect:  'Believing',
  belong:   'Belonging',
  mature:   'Maturing',
  minister: 'Ministering',
  multiply: 'Multiplying',
};

export const STAGE_DESC: Record<Stage, string> = {
  connect:  'In orbit — attending but not yet committed to Christ',
  belong:   'Came to faith, baptized, joined the church family',
  mature:   'Growing through Scripture, small group, prayer',
  minister: 'Using spiritual gifts in ministry within the church',
  multiply: 'On mission, discipling others, reproducing disciples',
};

export const SOURCE_LABEL: Record<ActionSource, string> = {
  chip: 'Chip · Teaching',
  jim:  'Jim · Coaching',
  impl: 'Implementation',
};

// ---------- LAWS ----------

export interface Law {
  /** "01" through "12" — string for stable IDs (sortable, typable) */
  n: string;
  /** "The Law of Purpose" — full title */
  title: string;
  /** "Purpose" — the part of the title to italicize in Newsreader serif */
  accent: string;
  /** One-line summary shown on the card */
  subtitle: string;
  /** Default status — overridden via law_status_overrides table */
  status: LawStatus;
  /** Audio session duration display ("52 min", "~50 min" for not-yet-extracted) */
  duration: string;
  /** Google Drive file ID for the audio MP3 */
  audioId: string;

  // === Optional teaching content (filled in as summaries are extracted from audio) ===

  /** Hero stat shown right after the law's hero — one signature number per law */
  heroStat?: HeroStat;
  /** Principle — Chip's defining quote */
  principle?: string;
  /** Author of principle (default "Chip Ingram") */
  principleAttr?: string;
  /** Lead paragraph shown in the hero */
  standfirst?: string;
  /** 5–7 numbered insight cards from the audio session */
  insights?: LawInsight[];
  /** Key for FEATURED_VISUALS map (e.g., 'twoDrivers' for Law 03) */
  frameworkKey?: string;
  /** Pull quote — set apart visually with floating gradient orbs */
  pullQuote?: string;
  pullAttr?: string;

  // === AAC-specific (populated via diagnostic capture flow) ===

  /** AAC's current diagnostic for this law — what's working, gaps, hard truth */
  diagnostic?: LawDiagnostic;
  /** Coaching strategies (Law 01 has these from Jim Wiegland; others can add) */
  coaching?: LawCoaching;
  /** Metrics to track for this law */
  metrics?: LawMetric[];
}

export interface HeroStat {
  /** "0", "94/92", "#1", "6,500+" — the dominant number */
  number: string;
  /** Eyebrow label above the caption */
  label: string;
  /** Italic Newsreader caption explaining the stat */
  text: string;
}

export interface LawInsight {
  title: string;
  body: string;
}

export interface LawDiagnostic {
  /** What AAC is doing well on this law (1-5 items) */
  working: string[];
  /** Where AAC needs to grow (1-5 items) */
  gaps: string[];
  /** One sentence of conviction — the core gap */
  hardTruth?: string;
}

export interface LawCoaching {
  coach: string;
  intro: string;
  /** Key for FEATURED_VISUALS (e.g., 'ppp') — renders before strategy cards */
  featuredVizKey?: string;
  strategies: CoachingStrategy[];
  /** Optional second meeting's strategies */
  meeting3?: CoachingStrategy[];
}

export interface CoachingStrategy {
  /** "Discovering people's design" */
  name: string;
  /** "Passion · Pain · Proficiency" — the dot-separated subtitle */
  concept: string;
  /** 2-4 sentence body */
  body: string;
}

export interface LawMetric {
  /** "Lost people who came to Christ (annual)" */
  metric: string;
  /** "Growing each year" / "60%+" / "100% of new converts" */
  goal: string;
  /** "0 (April 2026)" / "Unknown" / "In progress" — honest current state */
  current: string;
}

// ---------- PHASES & ACTIONS ----------

export interface Phase {
  n: PhaseN;
  /** "This Week", "Before Summer", etc. */
  title: string;
  /** "Do these before anything else" — secondary line */
  when: string;
  /** Italic intro paragraph */
  blurb: string;
}

export interface Action {
  /** Built-in: "p1-1", "p2-3". Custom: "cust-{lawN}-{base36ts}" */
  id: string;
  phase: PhaseN;
  source: ActionSource;
  /** Law number string ("01" through "12") */
  law: string;
  /** Short imperative title */
  title: string;
  /** 1-3 sentence body */
  body: string;
}

// ---------- PEOPLE ----------

/**
 * Person profile data syncs from Planning Center Online (PCO).
 * Stage assignments, pastoral notes, and history are AAC-owned (Supabase).
 */
export interface Person {
  /** PCO ID */
  id: string;
  /** Name from PCO */
  name: string;
  /** Initials for avatar (auto-derived if missing) */
  initials: string;
  /** Household name from PCO */
  household: string;
  /** Default stage from initial sync (defaults to 'mature' or 'belong' on PCO import) */
  stage: Stage;
  /** Days since last stage transition */
  stageDays: number;
  /** Member status (PCO field) */
  member: boolean;
  /** Human-readable last-touched display ("6d ago", "2 weeks ago") */
  updated: string;
  /** Engagement groups they participate in (from PCO group memberships) */
  maturingIn: string[];   // 'Life Groups' | 'Bible Studies' | 'PT Mentorship' | 'Discipleship Groups'
  /** Serve teams they're on (from PCO ministry memberships) */
  ministeringOn: string[]; // 'Announcement Team' | 'Communion' | etc.
  email: string;
  phone: string;
  /** Stage transition history (from stage_history table) */
  history: StageTransition[];
  /** Quick tags shown on tile (LG, BS, SRV, etc.) */
  tags: string[];
}

export interface StageTransition {
  from: Stage;
  to: Stage;
  /** Human-readable e.g. "5 days ago" */
  when: string;
}

// ---------- ACTIVITY EVENTS ----------

export type ActivityEvent =
  | StageMoveEvent
  | ActionToggleEvent
  | NoteSavedEvent
  | LawBeginEvent;

interface BaseEvent {
  type: string;
  /** Epoch ms */
  ts: number;
}

export interface StageMoveEvent extends BaseEvent {
  type: 'stage-move';
  payload: {
    personId: string;
    from: Stage;
    to: Stage;
  };
}

export interface ActionToggleEvent extends BaseEvent {
  type: 'action-toggle';
  payload: {
    actionId: string;
    lawN: string;
    isDone: boolean;
    title?: string;
  };
}

export interface NoteSavedEvent extends BaseEvent {
  type: 'note-saved';
  payload: {
    personId: string;
    /** First ~96 chars of the note */
    snippet: string;
  };
}

export interface LawBeginEvent extends BaseEvent {
  type: 'law-begin';
  payload: {
    lawN: string;
    status: LawStatus;
  };
}

// ---------- DIAGNOSTIC CAPTURE PAYLOAD ----------
// Shape Pastor Nate pastes back from a Claude conversation.

export interface DiagnosticCapturePayload {
  diagnostic: LawDiagnostic;
  actions: Array<{
    title: string;
    body: string;
    phase: PhaseN;
    source: ActionSource;
  }>;
  metrics: LawMetric[];
}

// ---------- ENGAGEMENT NAME -> ABBREVIATION MAP ----------

export const ENGAGEMENT_NAME_TO_ABBR: Record<string, EngagementAbbr> = {
  'Life Groups':         'LG',
  'Bible Studies':       'BS',
  'PT Mentorship':       'PT',
  'Discipleship Groups': 'DG',
  // Anything in ministeringOn maps to 'SRV'
};

// ---------- LOCAL STORAGE KEYS (prototype only — replace with Supabase reads in prod) ----------

export const STORAGE_KEYS = {
  /** Record<actionId, true> — checked actions */
  actionsChecked:     'aac-actions-checked-v1',
  /** Record<personId, string> — pastoral notes */
  pastoralNotes:      'aac-pastoral-notes-v1',
  /** Record<personId, Stage> — stage assignments */
  stageOverrides:     'aac-stage-overrides-v1',
  /** Record<lawN, LawStatus> — pending → in-progress → complete */
  lawStatusOverrides: 'aac-law-status-overrides-v1',
  /** string — the pinned vision statement */
  vision:             'aac-vision-statement-v1',
  /** ActivityEvent[] — newest first */
  events:             'aac-events-log-v1',
  /** Record<lawN, { diagnostic?, metrics? }> — populated via diagnostic capture */
  lawContent:         'aac-law-content-overrides-v1',
  /** Action[] — actions added via diagnostic capture */
  customActions:      'aac-custom-actions-v1',
} as const;
