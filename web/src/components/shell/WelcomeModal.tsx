import { useEffect, useId, useRef } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
    term: "Requirements",
    detail: "PRD runs for this project, newest first. Open one to read the document and its reviews.",
  },
  {
    term: "Architecture",
    detail: "Technical spine documents for the same project folder.",
  },
  {
    term: "Sprint status",
    detail: "Delivery board from sprint-status.yaml for this workspace.",
  },
  {
    term: "Method / Generated",
    detail: "Raw folder explorers for `_bmad` (install) and `_bmad-output` (what the method produced).",
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
          maxWidth: 480,
        },
      }}
    >
      <DialogContent sx={{ pt: "var(--space-8)", px: "var(--space-6)", pb: "var(--space-5)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "var(--space-3)", mb: "var(--space-5)" }}>
          <BrandMark size={36} />
          <Typography
            id={titleId}
            variant="h6"
            sx={{ fontWeight: 650, letterSpacing: "-0.02em", textWrap: "balance" }}
          >
            Welcome to BMAD Browser
          </Typography>
        </Box>

        <Typography
          variant="body1"
          sx={{
            mb: "var(--space-6)",
            maxWidth: "42ch",
            textWrap: "pretty",
            lineHeight: 1.55,
            color: "var(--color-text-muted)",
          }}
        >
          A read-only map of one BMAD project folder. The header shows the project name when it is
          known. The left nav is organised by document type — not by multiple products.
        </Typography>

        <Box
          component="dl"
          sx={{
            m: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
            mb: "var(--space-6)",
          }}
        >
          {GLOSSARY.map((row) => (
            <Box key={row.term} component="div">
              <Typography
                component="dt"
                variant="subtitle2"
                sx={{
                  color: "var(--color-accent)",
                  mb: "var(--space-1)",
                  lineHeight: 1.3,
                }}
              >
                {row.term}
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                sx={{
                  m: 0,
                  maxWidth: "44ch",
                  textWrap: "pretty",
                  lineHeight: 1.5,
                  color: "var(--color-text-subtle)",
                }}
              >
                {row.detail}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          role="note"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--space-3)",
            px: "var(--space-4)",
            py: "var(--space-3)",
            borderRadius: "var(--radius-control)",
            border: "1px solid var(--color-border-default)",
            bgcolor: "var(--color-accent-muted)",
          }}
        >
          <InfoOutlinedIcon
            aria-hidden
            sx={{
              mt: "1px",
              fontSize: 18,
              color: "var(--color-accent)",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: "var(--color-text-default)",
              textWrap: "pretty",
              lineHeight: 1.45,
              maxWidth: "40ch",
            }}
          >
            This viewer never writes, mutates, or deletes anything in this folder.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: "var(--space-6)",
          pb: "var(--space-6)",
          pt: "var(--space-2)",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
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
