import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { columnLetter, parseCsvGrid } from "../csvGrid.js";

interface CsvGridProps {
  content: string;
}

// Sticky positioning is applied per-cell (not per-row): row-level `position: sticky`
// backgrounds don't reliably paint over scrolling content in every browser's table
// rendering model, while cell-level stickiness is the standard, robust technique.

const COLUMN_LETTER_CELL_SX = {
  position: "sticky" as const,
  top: 0,
  zIndex: 2,
  backgroundColor: "background.paper",
};

// Approximate rendered height of the column-letter row at size="small", so the CSV's own
// header row freezes directly beneath it instead of overlapping.
const HEADER_ROW_TOP = 33;

const HEADER_CELL_SX = {
  position: "sticky" as const,
  top: HEADER_ROW_TOP,
  zIndex: 2,
  backgroundColor: "background.paper",
};

const ROW_NUMBER_CELL_SX = {
  position: "sticky" as const,
  left: 0,
  zIndex: 1,
  backgroundColor: "background.paper",
};

// The two corner cells (row-number column × column-letter/header rows) must stay pinned
// on both axes at once, and above every other sticky cell.
const CORNER_OVER_COLUMN_LETTERS_SX = { ...COLUMN_LETTER_CELL_SX, left: 0, zIndex: 3 };
const CORNER_OVER_HEADER_SX = { ...HEADER_CELL_SX, left: 0, zIndex: 3 };

// Plain data cells default to `position: static; z-index: auto`, which measurably paints
// above sticky-positioned sibling cells elsewhere in the same table in real browser
// testing, despite the CSS stacking spec's general rule that non-positioned content should
// paint below positioned content. Giving data cells an explicit position/z-index fixes it.
const DATA_CELL_SX = { position: "relative" as const, zIndex: 0 };

export default function CsvGrid({ content }: CsvGridProps) {
  const { header, rows } = parseCsvGrid(content);

  if (header === null) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        This CSV file is empty.
      </Typography>
    );
  }

  const widestRowLength = Math.max(header.length, ...rows.map((row) => row.length));
  const columnIndexes = Array.from({ length: widestRowLength }, (_, index) => index);

  return (
    <Table
      size="small"
      sx={{
        // `position: sticky` on table cells does not clip/occlude scrolling content
        // properly under the default `border-collapse: collapse` (MUI's own default) -
        // it requires `separate`. This, not any z-index arrangement, was the actual cause
        // of scrolled rows staying visible in front of the frozen header.
        borderCollapse: "separate",
        "& .MuiTableCell-root": { borderBottom: "none", borderRight: "1px solid", borderColor: "divider" },
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell sx={CORNER_OVER_COLUMN_LETTERS_SX} />
          {columnIndexes.map((columnIndex) => (
            <TableCell key={columnIndex} align="center" sx={{ ...COLUMN_LETTER_CELL_SX, color: "text.secondary" }}>
              {columnLetter(columnIndex)}
            </TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableCell sx={CORNER_OVER_HEADER_SX} />
          {columnIndexes.map((columnIndex) => (
            <TableCell key={columnIndex} sx={{ ...HEADER_CELL_SX, fontWeight: "bold" }}>
              {header[columnIndex] ?? ""}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={widestRowLength + 1} sx={DATA_CELL_SX}>
              <Typography color="text.secondary" sx={{ p: 2 }}>
                This CSV file has no data rows.
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={(theme) => ({
                "&:nth-of-type(odd)": { backgroundColor: "action.hover" },
                // An accent-colored wash, not a grayscale one: a black or white overlay here
                // would land close to whichever of the two grayscale row shades it's layered
                // onto, making striped and non-striped rows converge on hover instead of both
                // staying visibly distinct from their own resting shade. Targeted at descendant
                // cells (rather than the row itself) so it also reaches the sticky row-number
                // cell, which paints its own background separately.
                "&:hover .MuiTableCell-root": {
                  backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.primary.main, 0.16)})`,
                },
              })}
            >
              <TableCell sx={{ ...ROW_NUMBER_CELL_SX, color: "text.secondary" }}>{rowIndex + 1}</TableCell>
              {columnIndexes.map((columnIndex) => (
                <TableCell key={columnIndex} sx={DATA_CELL_SX}>
                  {row[columnIndex] ?? ""}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
