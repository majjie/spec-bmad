import { useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import FolderIcon from "@mui/icons-material/Folder";
import type { ContentsEntry } from "../api.js";
import { sortContentsEntries, type SortColumn, type SortDirection } from "../sortEntries.js";

interface ContentsTableProps {
  entries: ContentsEntry[] | null;
  onSelectFolder: (path: string) => void;
  onOpenFile: (path: string) => void;
}

const COLUMNS: { id: SortColumn; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "createdAt", label: "Created" },
  { id: "updatedAt", label: "Updated" },
  { id: "size", label: "Size" },
];

function formatSize(size: number | null): string {
  if (size === null) {
    return "-";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function ContentsTable({ entries, onSelectFolder, onOpenFile }: ContentsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  if (entries === null || entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        This folder is empty.
      </Typography>
    );
  }

  function handleHeaderClick(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const sortedEntries = sortContentsEntries(entries, sortColumn, sortDirection);

  return (
    <Table size="small" sx={{ "& .MuiTableCell-root": { borderBottom: "none" } }}>
      <TableHead>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableCell key={column.id}>
              <TableSortLabel
                active={sortColumn === column.id}
                direction={sortColumn === column.id ? sortDirection : "asc"}
                onClick={() => handleHeaderClick(column.id)}
              >
                {column.label}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {sortedEntries.map((entry) => (
          <TableRow
            key={entry.path}
            hover
            sx={{
              cursor: entry.type === "folder" ? "pointer" : "default",
              "&:nth-of-type(odd)": { backgroundColor: "action.hover" },
            }}
            onClick={() => {
              if (entry.type === "folder") {
                onSelectFolder(entry.path);
              }
            }}
            onDoubleClick={() => {
              if (entry.type === "file") {
                onOpenFile(entry.path);
              }
            }}
          >
            <TableCell>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {entry.type === "folder" && <FolderIcon fontSize="small" />}
                {entry.name}
              </Box>
            </TableCell>
            <TableCell>{formatDate(entry.createdAt)}</TableCell>
            <TableCell>{formatDate(entry.updatedAt)}</TableCell>
            <TableCell>{formatSize(entry.size)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
