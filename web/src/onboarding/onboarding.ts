export const ONBOARDING_STORAGE_KEY = "bmad-browser:onboarding:v3";

export type OnboardingState = "pending" | "skipped" | "completed";

export interface TourStep {
  id: string;
  /** Matches `data-tour` on an anchored element */
  anchor: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "sidebar",
    anchor: "sidebar",
    title: "Documents live here",
    body: "Requirements and Architecture hold this project's planning runs. Sprint status sits under Workspace when sprint-status.yaml is present.",
  },
  {
    id: "overview",
    anchor: "nav-overview",
    title: "Start on Overview",
    body: "Overview summarises the active epic and the latest requirements and architecture documents.",
  },
  {
    id: "stage",
    anchor: "main-stage",
    title: "Documents open here",
    body: "Selecting a PRD, architecture run, or Sprint status fills this stage. Method files and Generated files are the raw folders underneath.",
  },
  {
    id: "refresh",
    anchor: "refresh",
    title: "Reload from disk",
    body: "BMAD workflows write files on disk. Reload refreshes the tree without restarting. This viewer never writes to this folder.",
  },
  {
    id: "help",
    anchor: "help",
    title: "Replay anytime",
    body: "Use Help in the header to run this tour again - including after you skip it.",
  },
];

export function readOnboardingState(): OnboardingState {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (raw === "skipped" || raw === "completed") {
      return raw;
    }
  } catch {
    // private mode / blocked storage
  }
  return "pending";
}

export function writeOnboardingState(state: Exclude<OnboardingState, "pending">): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, state);
  } catch {
    // ignore
  }
}

export function clearOnboardingState(): void {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function shouldShowWelcome(state: OnboardingState = readOnboardingState()): boolean {
  return state === "pending";
}
