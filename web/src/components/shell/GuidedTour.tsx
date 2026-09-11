import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { TOUR_STEPS, resolvableTourSteps, type TourStep } from "../../onboarding/onboarding.js";

interface GuidedTourProps {
  open: boolean;
  onClose: (completed: boolean) => void;
}

interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measureAnchor(anchor: string): AnchorRect | null {
  const el = document.querySelector(`[data-tour="${anchor}"]`);
  if (!el) {
    return null;
  }
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function popoverPosition(rect: AnchorRect | null, stepIndex: number): { top: number; left: number } {
  if (!rect) {
    return { top: 96, left: 280 };
  }
  const gap = 12;
  const popoverWidth = 320;
  let left = rect.left + rect.width + gap;
  let top = rect.top;
  if (left + popoverWidth > window.innerWidth - 16) {
    left = Math.max(16, rect.left);
    top = rect.top + rect.height + gap;
  }
  if (stepIndex === 0) {
    left = rect.left + rect.width + gap;
    top = Math.max(64, rect.top + 24);
  }
  return { top: Math.min(top, window.innerHeight - 220), left: Math.min(left, window.innerWidth - popoverWidth - 16) };
}

export default function GuidedTour({ open, onClose }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>(TOUR_STEPS);
  const [rect, setRect] = useState<AnchorRect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const step: TourStep | undefined = steps[index];

  // Decide the step list against the page as it actually is, each time the tour opens -
  // the curated sidebar section is absent on a project with no `_bmad-output`, taking the
  // Overview anchor with it.
  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    setSteps(resolvableTourSteps(TOUR_STEPS, (anchor) => measureAnchor(anchor) !== null));
    setIndex(0);
  }, [open]);

  const refreshRect = useCallback(() => {
    if (!step) {
      return;
    }
    setRect(measureAnchor(step.anchor));
  }, [step]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    refreshRect();
    nextRef.current?.focus();
  }, [open, index, refreshRect]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose(false);
      }
    }
    function onResize() {
      refreshRect();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open, onClose, refreshRect]);

  if (!open || !step) {
    return null;
  }

  const pos = popoverPosition(rect, index);
  const isLast = index >= steps.length - 1;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={`Guided tour step ${index + 1} of ${steps.length}`}
      sx={{ position: "fixed", inset: 0, zIndex: 1400, pointerEvents: "none" }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "var(--color-scrim)",
          pointerEvents: "auto",
          transition: "opacity var(--duration-normal) var(--ease-out)",
        }}
        onClick={() => onClose(false)}
      />
      {rect && (
        <Box
          aria-hidden
          sx={{
            position: "fixed",
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            borderRadius: "var(--radius-control)",
            boxShadow: "0 0 0 9999px color-mix(in srgb, var(--color-shadow) 55%, transparent)",
            border: "2px solid var(--color-accent)",
            pointerEvents: "none",
            transition: "top var(--duration-normal) var(--ease-out), left var(--duration-normal) var(--ease-out), width var(--duration-normal) var(--ease-out), height var(--duration-normal) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          }}
        />
      )}
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: 320,
          p: 2,
          pointerEvents: "auto",
          bgcolor: "var(--color-bg-raised)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-overlay)",
          boxShadow: "var(--elevation-overlay)",
          backgroundImage: "none",
        }}
      >
        <Typography variant="caption" sx={{ color: "var(--color-text-subtle)" }}>
          {index + 1} / {steps.length}
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5, mb: 1, fontWeight: 650 }}>
          {step.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textWrap: "pretty" }}>
          {step.body}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Button size="small" color="inherit" onClick={() => onClose(false)}>
            Skip the tour
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            {index > 0 && (
              <Button size="small" onClick={() => setIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button
              ref={nextRef}
              size="small"
              variant="contained"
              onClick={() => {
                if (isLast) {
                  onClose(true);
                } else {
                  setIndex((i) => i + 1);
                }
              }}
            >
              {isLast ? "Finish" : "Next"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
