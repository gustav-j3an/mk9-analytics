export interface SpreadsheetCell {
  value: unknown;
  formattedValue?: string;
  formula?: string;
  type?: string;
}

export function isSpreadsheetCell(value: unknown): value is SpreadsheetCell {
  return typeof value === 'object' && value !== null && 'value' in value;
}

export function getCellValue(cell: unknown): unknown {
  return isSpreadsheetCell(cell) ? cell.value : cell;
}

export function getFormattedCellValue(cell: unknown): unknown {
  return isSpreadsheetCell(cell) ? cell.formattedValue : undefined;
}

export function getCellFormula(cell: unknown): unknown {
  return isSpreadsheetCell(cell) ? cell.formula : undefined;
}
