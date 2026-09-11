import { useEffect, useId, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import BrandMark from "./BrandMark.js";

interface WelcomeModalProps {
  open: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

const GLOSSARY = [
  {
    term: "Products",
    detail: "Named lineages from your BMAD folders (for example Harbor). Expand one to see its documents.",
  },
  {
    term: "Requirements",
    detail: "PRDs — what the organisation decided to build, grouped by date (newest first).",
  },
  {
    term: "Architecture",
    detail: "The technical spine for that product.",
  },
  {
    term: "Sprint status",
    detail: "Workspace delivery from sprint-status.yaml. It lives under Workspace, not inside a product.",
  },
];

export default function WelcomeModal({ open, onStartTour, onSkip }: WelcomeModalProps) {
  const titleId = useId();
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => startRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown={false}
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
          borderRadius: "var(--radius-overlay)",
          boxShadow: "var(--elevation-overlay)",
          backgroundImage: "none",
        },
      }}
    >
      <DialogContent sx={{ pt: 3.5, px: 3.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <BrandMark size={36} />
          <Typography id={titleId} variant="h6" sx={{ fontWeight: 650 }}>
            Welcome to BMAD Browser
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2.5, textWrap: "pretty", maxWidth: "48ch" }}>
          A read-only map of this workspace&apos;s BMAD artifacts. Products in the left nav are
          what BMAD has been planning — not this viewer&apos;s brand.
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
          This viewer never writes, mutates, or deletes anything in this folder.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3.5, pb: 3, gap: 1 }}>
        <Button onClick={onSkip} color="inherit">
          Skip, take me to the workspace
        </Button>
        <Button ref={startRef} variant="contained" onClick={onStartTour} disableElevation>
          Start the tour
        </Button>
      </DialogActions>
    </Dialog>
  );
}
