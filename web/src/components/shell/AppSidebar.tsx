import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import type { NavigatorTree, TabAvailability } from "../../api.js";
import type { ShellSection } from "../../shell.js";

interface AppSidebarProps {
  availability: TabAvailability | null;
  navigatorTree: NavigatorTree | null;
  activeSection: ShellSection;
  onSelect: (section: ShellSection) => void;
}

interface NavItem {
  section: ShellSection;
  label: string;
  secondary?: string;
  visible: boolean;
  tourId?: string;
}

export default function AppSidebar({
  availability,
  navigatorTree,
  activeSection,
  onSelect,
}: AppSidebarProps) {
  const nav = availability?.navigator ?? true;
  const primary: NavItem[] = [
    {
      section: "overview",
      label: "Overview",
      visible: nav,
      tourId: "nav-overview",
    },
    {
      section: "requirements",
      label: "Requirements",
      secondary: "PRDs",
      visible: nav && (availability === null || navigatorTree?.prd !== null),
    },
    {
      section: "architecture",
      label: "Architecture",
      secondary: "Spine",
      visible: nav && (availability === null || navigatorTree?.architecture !== null),
    },
    {
      section: "sprint",
      label: "Sprint",
      secondary: "Status & stories",
      visible: nav && (availability === null || navigatorTree?.sprintStatusAvailable === true),
    },
  ];

  const secondary: NavItem[] = [
    {
      section: "method",
      label: "Method files",
      secondary: "BMAD install (_bmad)",
      visible: availability === null || availability.infra,
    },
    {
      section: "generated",
      label: "Generated files",
      secondary: "What the method produced",
      visible: availability === null || availability.output,
    },
  ];

  function renderGroup(title: string, items: NavItem[]) {
    const shown = items.filter((item) => item.visible);
    if (shown.length === 0) {
      return null;
    }
    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="overline"
          sx={{ px: 2, color: "var(--color-text-subtle)", display: "block" }}
        >
          {title}
        </Typography>
        <List dense disablePadding>
          {shown.map((item) => {
            const selected = activeSection === item.section;
            return (
              <ListItemButton
                key={item.section}
                selected={selected}
                onClick={() => onSelect(item.section)}
                data-tour={item.tourId}
                sx={{
                  mx: 1,
                  borderRadius: "6px",
                  "&.Mui-selected": {
                    bgcolor: "var(--color-accent-muted)",
                    borderLeft: "2px solid var(--color-accent)",
                    pl: "14px",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "var(--color-accent-muted)",
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  secondary={item.secondary}
                  primaryTypographyProps={{
                    fontWeight: selected ? 600 : 500,
                    fontSize: "0.9rem",
                  }}
                  secondaryTypographyProps={{
                    fontSize: "0.7rem",
                    sx: { color: "var(--color-text-subtle)" },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    );
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
        py: 1.5,
      }}
    >
      {renderGroup("Documents", primary)}
      {renderGroup("Folders", secondary)}
    </Box>
  );
}
