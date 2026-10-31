// Build a CSV file in the browser (no library). Opens correctly in Excel and Google Sheets.

export type CsvCell = string | number | null | undefined;

// One value → one CSV field
function toField(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // CSV injection: Excel runs text that starts with = + - @ as a formula. A leading ' makes it plain text.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  // Commas, quotes and line breaks need quotes around the field; a quote inside becomes two quotes
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

// Rows of values → CSV text. The first row is usually the header.
export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(toField).join(',')).join('\r\n');
}

// Save the CSV as a file download
export function downloadCsv(filename: string, csv: string): void {
  // \uFEFF (byte order mark) tells Excel the file is UTF-8, so Burmese text isn't garbled
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // free the memory once the download has started
}
