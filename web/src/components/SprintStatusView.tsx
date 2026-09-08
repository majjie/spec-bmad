import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { SprintStatusResult } from "../api.js";

interface SprintStatusViewProps {
  data: SprintStatusResult;
}

const SUMMARY_FIELDS: { label: string; key: keyof SprintStatusResult["summary"] }[] = [
  { label: "Generated", key: "generated" },
  { label: "Last updated", key: "lastUpdated" },
  { label: "Project", key: "project" },
  { label: "Project key", key: "projectKey" },
  { label: "Tracking system", key: "trackingSystem" },
  { label: "Story location", key: "storyLocation" },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

function Tile({ children }: { children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 260 }}>
      {children}
    </Paper>
  );
}

export default function SprintStatusView({ data }: SprintStatusViewProps) {
  return (
    <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
      <Tile>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Summary
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {SUMMARY_FIELDS.map(({ label, key }) => (
            <Field key={key} label={label} value={data.summary[key]} />
          ))}
        </Box>
      </Tile>

      {data.epics.length === 0 ? (
        <Tile>
          <Typography variant="body2" color="text.secondary">
            No epics declared in this sprint-status file.
          </Typography>
        </Tile>
      ) : (
        data.epics.map((epic) => (
          <Tile key={epic.epicKey}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {epic.epicKey} — {epic.status}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1 }}>
              {epic.stories.map((story) => (
                <Typography key={story.key} variant="body2">
                  {story.key}: {story.status}
                </Typography>
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Retrospective: {epic.retrospectiveStatus ?? "not started"}
            </Typography>
          </Tile>
        ))
      )}
    </Box>
  );
}
