import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import SpaceDashboardOutlined from "@mui/icons-material/SpaceDashboardOutlined";
import type { NavigatorTree, TabAvailability } from "../../api.js";
import {
  buildProjectNav,
  expandForSelectionChange,
  formatArtifactLeafLabel,
  productNavSummary,
  projectKeyForSelection,
  seedExpandedIfNeeded,
  toggleExpandedKey,
  type ShellSelection,
} from "../../shell.js";
import { GroupLabel, NavRow, SectionLabel } from "./sidebarNav.js";

interface AppSidebarProps {
  availability: TabAvailability | null;
  navigatorTree: NavigatorTree | null;
  selection: ShellSelection;
  onSelect: (selection: ShellSelection) => void;
}

export default function AppSidebar({
  availability,
  navigatorTree,
  selection,
  onSelect,
}: AppSidebarProps) {
  const products = useMemo(() => buildProjectNav(navigatorTree), [navigatorTree]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const seededRef = useRef(false);
  const previousOwnerRef = useRef<string | undefined>(undefined);
  const sprintAvailable = navigatorTree?.sprintStatusAvailable === true;

  useEffect(() => {
    if (products.length === 0) {
      return;
    }
    setExpanded((prev) => {
      const result = seedExpandedIfNeeded(prev, products, seededRef.current);
      seededRef.current = result.seeded;
      return result.expanded;
    });
  }, [products]);

  useEffect(() => {
    const nextKey = projectKeyForSelection(products, selection);
    setExpanded((prev) => expandForSelectionChange(prev, previousOwnerRef.current, nextKey));
    previousOwnerRef.current = nextKey;
  }, [products, selection]);

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

      {showCurated && products.length > 0 && (
        <Box
          sx={{
            mt: 1,
            pt: 0.5,
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <SectionLabel>Products</SectionLabel>
          <List dense disablePadding>
            {products.map((product) => {
              const open = expanded.has(product.key);
              const summary = productNavSummary(product);
              const panelId = `product-panel-${product.key}`;
              const headerId = `product-header-${product.key}`;
              const ownsSelection = projectKeyForSelection([product], selection) === product.key;
              return (
                <Box
                  key={product.key}
                  sx={{
                    mx: 0,
                    mb: 0.25,
                    overflow: "hidden",
                    borderRadius: 0,
                    bgcolor: open ? "var(--color-bg-raised)" : "transparent",
                    boxShadow: "none",
                    transition: "background-color var(--duration-fast) var(--ease-out)",
                  }}
                >
                  <NavRow
                    id={headerId}
                    label={product.title}
                    {...(summary ? { secondary: summary } : {})}
                    selected={!open && ownsSelection}
                    onClick={() => setExpanded((prev) => toggleExpandedKey(prev, product.key))}
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
                        mb: 0.5,
                        borderTop: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      {product.requirements.length > 0 && (
                        <>
                          <GroupLabel>Requirements</GroupLabel>
                          {product.requirements.map((leaf) => (
                            <NavRow
                              key={leaf.path}
                              depth={1}
                              label={formatArtifactLeafLabel(leaf, "prd")}
                              selected={isSelected({ kind: "prd", path: leaf.path })}
                              onClick={() => onSelect({ kind: "prd", path: leaf.path })}
                            />
                          ))}
                        </>
                      )}
                      {product.architecture.length > 0 && (
                        <>
                          <GroupLabel>Architecture</GroupLabel>
                          {product.architecture.map((leaf) => (
                            <NavRow
                              key={leaf.path}
                              depth={1}
                              label={formatArtifactLeafLabel(leaf, "architecture")}
                              selected={isSelected({ kind: "architecture", path: leaf.path })}
                              onClick={() => onSelect({ kind: "architecture", path: leaf.path })}
                            />
                          ))}
                        </>
                      )}
                      {product.other.map((entry) => (
                        <NavRow
                          key={entry.path}
                          depth={1}
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
