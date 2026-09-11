export const ONBOARDING_STORAGE_KEY = "bmad-browser:onboarding";

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
    title: "Find your way",
    body: "Overview and the three document types live up top. Method files and Generated files are the raw BMAD folders when you need them.",
  },
  {
    id: "overview",
    anchor: "nav-overview",
    title: "Start on Overview",
    body: "When you do not know the method yet, Overview shows what is in progress and the latest planning documents.",
  },
  {
    id: "stage",
    anchor: "main-stage",
    title: "Read the documents",
    body: "Requirements, Architecture, and Sprint open in this stage — PRDs, the architecture spine, and sprint status.",
  },
  {
    id: "refresh",
    anchor: "refresh",
    title: "Reload from disk",
    body: "BMAD workflows write files on disk. Refresh reloads the cached folder tree without restarting the server. This viewer never writes to your project.",
  },
  {
    id: "help",
    anchor: "help",
    title: "Replay anytime",
    body: "Use Help in the header to run this tour again. You can skip it whenever you like.",
  },
];

export function readOnboardingState(): OnboardingState {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (raw === "skipped" || raw === "completed") {
      return raw;
    }
  } catch {
    // private mode / blocked storage — treat as pending so welcome still shows once per session
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

export function shouldShowWelcome(state: OnboardingState = readOnboardingState()): boolean {
  return state === "pending";
}
