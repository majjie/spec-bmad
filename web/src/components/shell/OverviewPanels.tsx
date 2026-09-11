import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { ActionItem } from "../../api.js";
import { formatArtifactLeafLabel, type ProjectNavLeaf } from "../../shell.js";
import { ListRow, Panel } from "../stage/Stage.js";

export { Panel };

export function ArtifactList({
  leaves,
  kind,
  empty,
  onOpen,
}: {
  leaves: ProjectNavLeaf[];
  kind: "prd" | "architecture";
  empty?: string;
  onOpen: (leaf: ProjectNavLeaf) => void;
}) {
  if (leaves.length === 0) {
    return empty ? (
      <Typography variant="body2" color="text.secondary">
        {empty}
      </Typography>
    ) : null;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {leaves.map((leaf) => (
        <ListRow key={leaf.path} onClick={() => onOpen(leaf)}>
          <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
            {formatArtifactLeafLabel(leaf, kind)}
          </Typography>
        </ListRow>
      ))}
    </Box>
  );
}

export function OpenItems({ items, onOpenFile }: { items: ActionItem[]; onOpenFile: (path: string) => void }) {
  const open = items.filter((item) => item.status !== "done");
  if (open.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No open action items.
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {open.slice(0, 6).map((item) => (
        <ListRow key={item.id}>
          <Typography variant="body2" sx={{ textWrap: "pretty", minWidth: 0 }}>
            {item.action ?? item.id}
          </Typography>
          {item.resolvedPath && (
            <Button size="small" variant="outlined" onClick={() => onOpenFile(item.resolvedPath!)}>
              Open file
            </Button>
          )}
        </ListRow>
      ))}
    </Box>
  );
}
