import Papa from "papaparse";

export interface ParsedCsv {
  header: string[] | null;
  rows: string[][];
}

/**
 * Spreadsheet-style bijective base-26 column label: 0 → "A", 25 → "Z", 26 → "AA", ...
 */
export function columnLetter(index: number): string {
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

/**
 * Parses CSV text into a header row plus data rows, per data-model.md's derivation rules.
 * Ragged rows are left unpadded - padding for display happens at render time in CsvGrid.
 */
export function parseCsvGrid(text: string): ParsedCsv {
  const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
  const [header, ...rows] = result.data;
  return { header: header ?? null, rows };
}
