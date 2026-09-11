import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import SpaceDashboardOutlined from "@mui/icons-material/SpaceDashboardOutlined";
import type { NavigatorTree, TabAvailability } from "../../api.js";
import {
  buildProjectNav,
  expandForSelectionChange,
  projectKeyForSelection,
  seedExpandedIfNeeded,
  toggleExpandedKey,
  type ProjectNavGroup,
  type ShellSelection,
} from "../../shell.js";
import { GroupLabel, NavRow, SectionLabel } from "./sidebarNav.js";

interface AppSidebarProps {
  availability: TabAvailability | null;
  navigatorTree: NavigatorTree | null;
  sprintProject: string | null;
  selection: ShellSelection;
  onSelect: (selection: ShellSelection) => void;
}

function projectSummary(project: ProjectNavGroup): string | undefined {
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

export default function AppSidebar({
  availability,
  navigatorTree,
  sprintProject,
  selection,
  onSelect,
}: AppSidebarProps) {
  const projects = useMemo(
    () => buildProjectNav(navigatorTree, sprintProject),
    [navigatorTree, sprintProject],
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const seededRef = useRef(false);
  const previousOwnerRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }
    setExpanded((prev) => {
      const result = seedExpandedIfNeeded(prev, projects, seededRef.current);
      seededRef.current = result.seeded;
      return result.expanded;
    });
  }, [projects]);

  useEffect(() => {
    const nextKey = projectKeyForSelection(projects, selection);
    setExpanded((prev) => expandForSelectionChange(prev, previousOwnerRef.current, nextKey));
    previousOwnerRef.current = nextKey;
  }, [projects, selection]);

  function isSelected(sel: ShellSelection): boolean {
    if (selection.kind !== sel.kind) {
      return false;
    }
    if (sel.kind === "prd" || sel.kind === "architecture") {
      return selection.kind === sel.kind && selection.path === sel.path;
    }
    return true;
  }

  const showMethod = availability === null || availability.infra;
  const showGenerated = availability === null || availability.output;
  const showCurated = availability === null || availability.navigator;

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
        py: 0.5,
      }}
    >
      {showCurated && (
        <Box>
          <SectionLabel>Workspace</SectionLabel>
          <List dense disablePadding>
            <NavRow
              label="Overview"
              selected={selection.kind === "overview"}
              onClick={() => onSelect({ kind: "overview" })}
              tourId="nav-overview"
              icon={<SpaceDashboardOutlined fontSize="small" />}
            />
          </List>
        </Box>
      )}

      {showCurated && projects.length > 0 && (
        <Box
          sx={{
            mt: 1,
            pt: 0.5,
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <SectionLabel>Projects</SectionLabel>
          <List dense disablePadding>
            {projects.map((project) => {
              const open = expanded.has(project.key);
              const summary = projectSummary(project);
              const panelId = `project-panel-${project.key}`;
              const headerId = `project-header-${project.key}`;
              const ownsSelection = projectKeyForSelection([project], selection) === project.key;
              return (
                <Box
                  key={project.key}
                  sx={{
                    mx: 1,
                    mb: 0.75,
                    overflow: "hidden",
                    borderRadius: 0,
                    bgcolor: open ? "var(--color-bg-subtle)" : "transparent",
                    boxShadow: "none",
                    transition: "background-color var(--duration-fast) var(--ease-out)",
                  }}
                >
                  <NavRow
                    id={headerId}
                    flush
                    label={project.title}
                    {...(summary ? { secondary: summary } : {})}
                    selected={!open && ownsSelection}
                    onClick={() => setExpanded((prev) => toggleExpandedKey(prev, project.key))}
                    ariaExpanded={open}
                    ariaControls={panelId}
                  />
                  <Collapse
                    in={open}
                    timeout={280}
                    unmountOnExit
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                  >
                    <List
                      dense
                      disablePadding
                      sx={{
                        ml: 2.5,
                        mr: 0.5,
                        mb: 0.75,
                        pl: 1,
                        borderLeft: "1px solid var(--color-border-default)",
                      }}
                    >
                      {project.requirements.length > 0 && (
                        <>
                          <GroupLabel>Requirements</GroupLabel>
                          {project.requirements.map((leaf) => (
                            <NavRow
                              key={leaf.path}
                              depth={1}
                              flush
                              label={leaf.isLatest ? `${leaf.date} · latest` : leaf.date || leaf.folderName}
                              selected={isSelected({ kind: "prd", path: leaf.path })}
                              onClick={() => onSelect({ kind: "prd", path: leaf.path })}
                            />
                          ))}
                        </>
                      )}
                      {project.architecture.length > 0 && (
                        <>
                          <GroupLabel>Architecture</GroupLabel>
                          {project.architecture.map((leaf) => (
                            <NavRow
                              key={leaf.path}
                              depth={1}
                              flush
                              label={leaf.isLatest ? `${leaf.date} · latest` : leaf.date || leaf.folderName}
                              selected={isSelected({ kind: "architecture", path: leaf.path })}
                              onClick={() => onSelect({ kind: "architecture", path: leaf.path })}
                            />
                          ))}
                        </>
                      )}
                      {project.hasSprint && (
                        <>
                          <GroupLabel>Delivery</GroupLabel>
                          <NavRow
                            depth={1}
                            flush
                            label="Sprint status"
                            selected={selection.kind === "sprint"}
                            onClick={() => onSelect({ kind: "sprint" })}
                          />
                        </>
                      )}
                      {project.other.map((entry) => (
                        <NavRow
                          key={entry.path}
                          depth={1}
                          flush
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
        <Box
          sx={{
            mt: 1,
            pt: 0.5,
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <SectionLabel>Folders</SectionLabel>
          <List dense disablePadding>
            {showMethod && (
              <NavRow
                label="Method files"
                secondary="_bmad install"
                selected={selection.kind === "method"}
                onClick={() => onSelect({ kind: "method" })}
                icon={<FolderOutlined fontSize="small" />}
              />
            )}
            {showGenerated && (
              <NavRow
                label="Generated files"
                secondary="_bmad-output"
                selected={selection.kind === "generated"}
                onClick={() => onSelect({ kind: "generated" })}
                icon={<Inventory2Outlined fontSize="small" />}
              />
            )}
          </List>
        </Box>
      )}
    </Box>
  );
}
