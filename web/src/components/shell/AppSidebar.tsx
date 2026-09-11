import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import SpaceDashboardOutlined from "@mui/icons-material/SpaceDashboardOutlined";
import type { NavigatorTree, TabAvailability } from "../../api.js";
import {
  buildProjectNav,
  expandForDocSelection,
  expandKeyForSlug,
  formatArtifactLeafLabel,
  hasMultipleNamedSlugs,
  slugNavSummary,
  keysForDocSelection,
  namedSlugGroups,
  seedExpandedIfNeeded,
  sectionHasLeaves,
  toggleExpandedKey,
  type DocSectionId,
  type ProjectNavGroup,
  type ShellSelection,
} from "../../shell.js";
import { GroupLabel, NavRow, SectionLabel } from "./sidebarNav.js";

interface AppSidebarProps {
  availability: TabAvailability | null;
  navigatorTree: NavigatorTree | null;
  selection: ShellSelection;
  onSelect: (selection: ShellSelection) => void;
}

function DocSection({
  id,
  label,
  icon,
  open,
  onToggle,
  selectedInside,
  children,
  tourId,
}: {
  id: DocSectionId;
  label: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  selectedInside: boolean;
  children: ReactNode;
  tourId?: string;
}) {
  const panelId = `doc-panel-${id}`;
  const headerId = `doc-header-${id}`;
  return (
    <Box
      sx={{
        mb: 0,
        bgcolor: open ? "var(--color-bg-subtle)" : "transparent",
      }}
    >
      <NavRow
        id={headerId}
        label={label}
        selected={!open && selectedInside}
        onClick={onToggle}
        ariaExpanded={open}
        ariaControls={panelId}
        {...(tourId ? { tourId } : {})}
        icon={icon}
      />
      <Collapse in={open} timeout={280} unmountOnExit id={panelId} role="region" aria-labelledby={headerId}>
        <List dense disablePadding sx={{ pb: 0.75 }}>
          {children}
        </List>
      </Collapse>
    </Box>
  );
}

function SlugNest({
  section,
  group,
  open,
  onToggle,
  selectedInside,
  children,
}: {
  section: DocSectionId;
  group: ProjectNavGroup;
  open: boolean;
  onToggle: () => void;
  selectedInside: boolean;
  children: ReactNode;
}) {
  const key = expandKeyForSlug(section, group.key);
  const panelId = `slug-panel-${key}`;
  const headerId = `slug-header-${key}`;
  const summary = slugNavSummary(group);
  return (
    <Box>
      <NavRow
        id={headerId}
        depth={1}
        label={group.title}
        {...(summary ? { secondary: summary } : {})}
        selected={!open && selectedInside}
        onClick={onToggle}
        ariaExpanded={open}
        ariaControls={panelId}
      />
      <Collapse in={open} timeout={280} unmountOnExit id={panelId} role="region" aria-labelledby={headerId}>
        <List dense disablePadding>
          {children}
        </List>
      </Collapse>
    </Box>
  );
}

export default function AppSidebar({
  availability,
  navigatorTree,
  selection,
  onSelect,
}: AppSidebarProps) {
  const groups = useMemo(() => buildProjectNav(navigatorTree), [navigatorTree]);
  const multiSlug = hasMultipleNamedSlugs(groups);
  const named = namedSlugGroups(groups);
  const other = groups.find((g) => g.key === "_other");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const seededRef = useRef(false);
  const previousKeysRef = useRef<Set<string>>(new Set());
  const sprintAvailable = navigatorTree?.sprintStatusAvailable === true;

  useEffect(() => {
    if (groups.length === 0) {
      return;
    }
    setExpanded((prev) => {
      const result = seedExpandedIfNeeded(prev, groups, seededRef.current);
      seededRef.current = result.seeded;
      return result.expanded;
    });
  }, [groups]);

  useEffect(() => {
    const nextKeys = keysForDocSelection(groups, selection);
    setExpanded((prev) => expandForDocSelection(prev, previousKeysRef.current, nextKeys));
    previousKeysRef.current = new Set(nextKeys);
  }, [groups, selection]);

  function isSelected(sel: ShellSelection): boolean {
    if (selection.kind !== sel.kind) {
      return false;
    }
    if (sel.kind === "prd" || sel.kind === "architecture") {
      return selection.kind === sel.kind && selection.path === sel.path;
    }
    return true;
  }

  function selectionInRequirements(): boolean {
    if (selection.kind === "prd") {
      return true;
    }
    return false;
  }

  function selectionInArchitecture(): boolean {
    return selection.kind === "architecture";
  }

  function selectionInSlug(group: ProjectNavGroup, section: DocSectionId): boolean {
    if (section === "requirements" && selection.kind === "prd") {
      return (
        group.requirements.some((l) => l.path === selection.path) ||
        group.other.some((e) => e.path === selection.path)
      );
    }
    if (section === "architecture" && selection.kind === "architecture") {
      return group.architecture.some((l) => l.path === selection.path);
    }
    return false;
  }

  const showMethod = availability === null || availability.infra;
  const showGenerated = availability === null || availability.output;
  const showCurated = availability === null || availability.navigator;
  const showRequirements = sectionHasLeaves(groups, "requirements");
  const showArchitecture = sectionHasLeaves(groups, "architecture");

  function renderRequirementLeaves(group: ProjectNavGroup, depth: 1 | 2) {
    return (
      <>
        {group.requirements.map((leaf) => (
          <NavRow
            key={leaf.path}
            depth={depth}
            label={formatArtifactLeafLabel(leaf, "prd")}
            selected={isSelected({ kind: "prd", path: leaf.path })}
            onClick={() => onSelect({ kind: "prd", path: leaf.path })}
          />
        ))}
        {group.other.map((entry) => (
          <NavRow
            key={entry.path}
            depth={depth}
            label={entry.folderName}
            selected={isSelected({ kind: "prd", path: entry.path })}
            onClick={() => onSelect({ kind: "prd", path: entry.path })}
          />
        ))}
      </>
    );
  }

  function renderArchitectureLeaves(group: ProjectNavGroup, depth: 1 | 2) {
    return group.architecture.map((leaf) => (
      <NavRow
        key={leaf.path}
        depth={depth}
        label={formatArtifactLeafLabel(leaf, "architecture")}
        selected={isSelected({ kind: "architecture", path: leaf.path })}
        onClick={() => onSelect({ kind: "architecture", path: leaf.path })}
      />
    ));
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
        bgcolor: "var(--color-bg-sidebar)",
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
            {sprintAvailable && (
              <NavRow
                label="Sprint status"
                selected={selection.kind === "sprint"}
                onClick={() => onSelect({ kind: "sprint" })}
                tourId="nav-sprint"
                icon={<FlagOutlined fontSize="small" />}
              />
            )}
          </List>
        </Box>
      )}

      {showCurated && (showRequirements || showArchitecture) && (
        <Box
          sx={{
            mt: 1,
            pt: 0.5,
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <SectionLabel>Documents</SectionLabel>
          <List dense disablePadding>
            {showRequirements && (
              <DocSection
                id="requirements"
                label="Requirements"
                icon={<DescriptionOutlined fontSize="small" />}
                open={expanded.has("requirements")}
                onToggle={() => setExpanded((prev) => toggleExpandedKey(prev, "requirements"))}
                selectedInside={selectionInRequirements()}
                tourId="nav-requirements"
              >
                {multiSlug ? (
                  <>
                    {named.map((group) => {
                      if (group.requirements.length === 0 && group.other.length === 0) {
                        return null;
                      }
                      const slugKey = expandKeyForSlug("requirements", group.key);
                      // other only lives on _other group — named groups won't have other
                      return (
                        <SlugNest
                          key={group.key}
                          section="requirements"
                          group={group}
                          open={expanded.has(slugKey)}
                          onToggle={() => setExpanded((prev) => toggleExpandedKey(prev, slugKey))}
                          selectedInside={selectionInSlug(group, "requirements")}
                        >
                          {renderRequirementLeaves(group, 2)}
                        </SlugNest>
                      );
                    })}
                    {other && other.other.length > 0 && (
                      <>
                        <GroupLabel>Other</GroupLabel>
                        {other.other.map((entry) => (
                          <NavRow
                            key={entry.path}
                            depth={1}
                            label={entry.folderName}
                            selected={isSelected({ kind: "prd", path: entry.path })}
                            onClick={() => onSelect({ kind: "prd", path: entry.path })}
                          />
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {named.map((group) => renderRequirementLeaves(group, 1))}
                    {other?.other.map((entry) => (
                      <NavRow
                        key={entry.path}
                        depth={1}
                        label={entry.folderName}
                        selected={isSelected({ kind: "prd", path: entry.path })}
                        onClick={() => onSelect({ kind: "prd", path: entry.path })}
                      />
                    ))}
                  </>
                )}
              </DocSection>
            )}

            {showArchitecture && (
              <DocSection
                id="architecture"
                label="Architecture"
                icon={<AccountTreeOutlined fontSize="small" />}
                open={expanded.has("architecture")}
                onToggle={() => setExpanded((prev) => toggleExpandedKey(prev, "architecture"))}
                selectedInside={selectionInArchitecture()}
                tourId="nav-architecture"
              >
                {multiSlug ? (
                  named.map((group) => {
                    if (group.architecture.length === 0) {
                      return null;
                    }
                    const slugKey = expandKeyForSlug("architecture", group.key);
                    return (
                      <SlugNest
                        key={group.key}
                        section="architecture"
                        group={group}
                        open={expanded.has(slugKey)}
                        onToggle={() => setExpanded((prev) => toggleExpandedKey(prev, slugKey))}
                        selectedInside={selectionInSlug(group, "architecture")}
                      >
                        {renderArchitectureLeaves(group, 2)}
                      </SlugNest>
                    );
                  })
                ) : (
                  named.map((group) => renderArchitectureLeaves(group, 1))
                )}
              </DocSection>
            )}
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
