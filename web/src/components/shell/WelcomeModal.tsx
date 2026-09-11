import { useEffect, useId, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";

interface WelcomeModalProps {
  open: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

const GLOSSARY = [
  {
    term: "Requirements",
    detail: "The product — PRDs that capture what the organisation decided to build.",
  },
  {
    term: "Architecture",
    detail: "The technical spine — decisions that keep independently built epics compatible.",
  },
  {
    term: "Sprint",
    detail: "What is in progress — epic and story status from sprint-status.yaml.",
  },
];

export default function WelcomeModal({ open, onStartTour, onSkip }: WelcomeModalProps) {
  const titleId = useId();
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      startRef.current?.focus();
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === "backdropClick") {
          return;
        }
        onSkip();
      }}
      aria-labelledby={titleId}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "var(--color-bg-raised)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-lg)",
          backgroundImage: "none",
        },
      }}
    >
      <DialogContent sx={{ pt: 3.5, px: 3.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-amber-600) 100%)",
            }}
          />
          <Typography id={titleId} variant="h6" sx={{ fontWeight: 650 }}>
            Welcome to BMAD Browser
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2.5, textWrap: "pretty", maxWidth: "48ch" }}>
          A read-only map of this project&apos;s BMAD artifacts — so you can understand decisions
          and progress without already knowing the method.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2.5 }}>
          {GLOSSARY.map((row) => (
            <Box key={row.term}>
              <Typography variant="subtitle2" sx={{ color: "var(--color-accent)" }}>
                {row.term}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {row.detail}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary">
          This viewer never writes, mutates, or deletes anything in your project.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3.5, pb: 3, gap: 1 }}>
        <Button onClick={onSkip} color="inherit">
          Skip, take me to the project
        </Button>
        <Button ref={startRef} variant="contained" onClick={onStartTour}>
          Start the tour
        </Button>
      </DialogActions>
    </Dialog>
  );
}
