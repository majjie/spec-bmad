import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import type { NavigatorTree, TabAvailability } from "../../api.js";
import { buildProjectNav, type ShellSelection } from "../../shell.js";

interface AppSidebarProps {
  availability: TabAvailability | null;
  navigatorTree: NavigatorTree | null;
  sprintProject: string | null;
  selection: ShellSelection;
  onSelect: (selection: ShellSelection) => void;
}

const itemSx = {
  mx: 0,
  borderRadius: 0,
  py: 0.75,
  "&.Mui-selected": {
    bgcolor: "var(--color-bg-subtle)",
  },
  "&.Mui-selected:hover": {
    bgcolor: "var(--color-bg-hover)",
  },
};

/** Flat selected row — no pill radius, no curved chrome. */
function NavRow({
  label,
  secondary,
  selected,
  onClick,
  depth = 0,
  tourId,
  endIcon,
}: {
  label: string;
  secondary?: string;
  selected: boolean;
  onClick: () => void;
  depth?: number;
  tourId?: string;
  endIcon?: ReactNode;
}) {
  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      data-tour={tourId}
      sx={{ ...itemSx, pl: 1.5 + depth * 1.5 }}
    >
      <ListItemText
        primary={label}
        secondary={secondary}
        primaryTypographyProps={{
          fontWeight: selected ? 600 : 500,
          fontSize: depth === 0 ? "0.9rem" : "0.825rem",
        }}
        secondaryTypographyProps={{
          fontSize: "0.7rem",
          sx: { color: "var(--color-text-subtle)" },
        }}
      />
      {endIcon}
    </ListItemButton>
  );
}

export default function AppSidebar({
  availability,
  navigatorTree,
  sprintProject,
  selection,
  onSelect,
}: AppSidebarProps) {
  const projects = buildProjectNav(navigatorTree, sprintProject);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }
    setExpanded((prev) => {
      if (prev.size > 0) {
        return prev;
      }
      const withSprint = projects.find((p) => p.hasSprint);
      return new Set([(withSprint ?? projects[0]!).key]);
    });
  }, [projects]);

  useEffect(() => {
    if (selection.kind === "prd" || selection.kind === "architecture") {
      const match = projects.find(
        (p) =>
          p.requirements.some((l) => l.path === selection.path) ||
          p.architecture.some((l) => l.path === selection.path) ||
          p.other.some((o) => o.path === selection.path),
      );
      if (match) {
        setExpanded((prev) => new Set(prev).add(match.key));
      }
    }
    if (selection.kind === "sprint") {
      const match = projects.find((p) => p.hasSprint);
      if (match) {
        setExpanded((prev) => new Set(prev).add(match.key));
      }
    }
  }, [selection, projects]);

  function toggleProject(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function projectSummary(project: (typeof projects)[number]): string | undefined {
    if (project.key === "_other") {
      return "Unsorted folders";
    }
    const parts: string[] = [];
    if (project.requirements.length > 0) {
      parts.push(`${project.requirements.length} PRD${project.requirements.length === 1 ? "" : "s"}`);
    }
    if (project.architecture.length > 0) {
      parts.push(
        `${project.architecture.length} architecture${project.architecture.length === 1 ? "" : "s"}`,
      );
    }
    if (project.hasSprint) {
      parts.push("sprint");
    }
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }

  const showMethod = availability === null || availability.infra;
  const showGenerated = availability === null || availability.output;
  const showCurated = availability === null || availability.navigator;

  function isSelected(sel: ShellSelection): boolean {
    if (selection.kind !== sel.kind) {
      return false;
    }
    if (sel.kind === "prd" || sel.kind === "architecture") {
      return selection.kind === sel.kind && selection.path === sel.path;
    }
    return true;
  }

  return (
    <Box
      component="nav"
      aria-label="Primary"
      data-tour="sidebar"
      sx={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        borderRight: "1px solid var(--color-border-default)",
        bgcolor: "var(--color-bg-surface)",
        overflow: "auto",
        py: 1,
      }}
    >
      {showCurated && (
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="overline"
            sx={{ px: 2, color: "var(--color-text-subtle)", display: "block" }}
          >
            Workspace
          </Typography>
          <List dense disablePadding>
            <NavRow
              label="Overview"
              selected={selection.kind === "overview"}
              onClick={() => onSelect({ kind: "overview" })}
              tourId="nav-overview"
            />
          </List>
        </Box>
      )}

      {showCurated && projects.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="overline"
            sx={{ px: 2, color: "var(--color-text-subtle)", display: "block" }}
          >
            Projects
          </Typography>
          <List dense disablePadding>
            {projects.map((project) => {
              const open = expanded.has(project.key);
              const summary = projectSummary(project);
              return (
                <Box key={project.key}>
                  <NavRow
                    label={project.title}
                    {...(summary ? { secondary: summary } : {})}
                    selected={false}
                    onClick={() => toggleProject(project.key)}
                    endIcon={open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  />
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <List dense disablePadding>
                      {project.requirements.length > 0 && (
                        <>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              px: 2,
                              pt: 1,
                              pb: 0.25,
                              pl: 4,
                              color: "var(--color-text-subtle)",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              fontSize: "0.65rem",
                            }}
                          >
                            Requirements
                          </Typography>
                          {project.requirements.map((leaf) => (
                            <NavRow
                              key={leaf.path}
                              depth={2}
                              label={leaf.isLatest ? `${leaf.date} · latest` : leaf.date || leaf.folderName}
                              selected={isSelected({ kind: "prd", path: leaf.path })}
                              onClick={() => onSelect({ kind: "prd", path: leaf.path })}
                            />
                          ))}
                        </>
                      )}
                      {project.architecture.length > 0 && (
                        <>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              px: 2,
                              pt: 1,
                              pb: 0.25,
                              pl: 4,
                              color: "var(--color-text-subtle)",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              fontSize: "0.65rem",
                            }}
                          >
                            Architecture
                          </Typography>
                          {project.architecture.map((leaf) => (
                            <NavRow
                              key={leaf.path}
                              depth={2}
                              label={leaf.isLatest ? `${leaf.date} · latest` : leaf.date || leaf.folderName}
                              selected={isSelected({ kind: "architecture", path: leaf.path })}
                              onClick={() => onSelect({ kind: "architecture", path: leaf.path })}
                            />
                          ))}
                        </>
                      )}
                      {project.hasSprint && (
                        <>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              px: 2,
                              pt: 1,
                              pb: 0.25,
                              pl: 4,
                              color: "var(--color-text-subtle)",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              fontSize: "0.65rem",
                            }}
                          >
                            Delivery
                          </Typography>
                          <NavRow
                            depth={2}
                            label="Sprint status"
                            selected={selection.kind === "sprint"}
                            onClick={() => onSelect({ kind: "sprint" })}
                          />
                        </>
                      )}
                      {project.other.map((entry) => (
                        <NavRow
                          key={entry.path}
                          depth={2}
                          label={entry.folderName}
                          selected={isSelected({ kind: "prd", path: entry.path })}
                          onClick={() => onSelect({ kind: "prd", path: entry.path })}
                        />
                      ))}
                    </List>
                  </Collapse>
                </Box>
              );
            })}
          </List>
        </Box>
      )}

      {(showMethod || showGenerated) && (
        <Box>
          <Typography
            variant="overline"
            sx={{ px: 2, color: "var(--color-text-subtle)", display: "block" }}
          >
            Folders
          </Typography>
          <List dense disablePadding>
            {showMethod && (
              <NavRow
                label="Method files"
                secondary="_bmad install"
                selected={selection.kind === "method"}
                onClick={() => onSelect({ kind: "method" })}
              />
            )}
            {showGenerated && (
              <NavRow
                label="Generated files"
                secondary="_bmad-output"
                selected={selection.kind === "generated"}
                onClick={() => onSelect({ kind: "generated" })}
              />
            )}
          </List>
        </Box>
      )}
    </Box>
  );
}
