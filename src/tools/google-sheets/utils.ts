import { CellValue } from "./types.js";

/**
 * 列番号をアルファベットに変換（0ベース）
 * 例: 0 -> A, 1 -> B, 25 -> Z, 26 -> AA
 */
export function columnToLetter(column: number): string {
  let result = "";
  while (column >= 0) {
    result = String.fromCharCode(65 + (column % 26)) + result;
    column = Math.floor(column / 26) - 1;
  }
  return result;
}

/**
 * アルファベットを列番号に変換（0ベース）
 * 例: A -> 0, B -> 1, Z -> 25, AA -> 26
 */
export function letterToColumn(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result - 1;
}

/**
 * 位置をA1記法に変換
 */
export function toA1Notation(position: string | { row: number; col: number }): string {
  if (typeof position === "string") {
    return position;
  }
  
  const { row, col } = position;
  const columnLetter = columnToLetter(col);
  return `${columnLetter}${row + 1}`;
}

/**
 * A1記法を行列番号に変換
 */
export function fromA1Notation(a1: string): { row: number; col: number } {
  const match = a1.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid A1 notation: ${a1}`);
  }
  
  const [, columnLetter, rowString] = match;
  const col = letterToColumn(columnLetter);
  const row = parseInt(rowString, 10) - 1;
  
  return { row, col };
}

/**
 * 書き込み範囲の終了位置を計算
 */
export function calculateEndPosition(
  startPosition: string | { row: number; col: number },
  values: CellValue[][]
): string {
  const start = typeof startPosition === "string" 
    ? fromA1Notation(startPosition) 
    : startPosition;
  
  if (values.length === 0 || values[0].length === 0) {
    return toA1Notation(start);
  }
  
  const endRow = start.row + values.length - 1;
  const endCol = start.col + values[0].length - 1;
  
  return toA1Notation({ row: endRow, col: endCol });
}

/**
 * 範囲文字列を生成
 */
export function generateRange(start: string, end: string): string {
  if (start === end) {
    return start;
  }
  return `${start}:${end}`;
}

/**
 * 範囲文字列をパース
 */
export function parseRange(range: string): {
  start: { row: number; col: number };
  end: { row: number; col: number };
} {
  const parts = range.split(":");
  if (parts.length === 1) {
    // 単一セル
    const position = fromA1Notation(parts[0]);
    return { start: position, end: position };
  } else if (parts.length === 2) {
    // 範囲
    return {
      start: fromA1Notation(parts[0]),
      end: fromA1Notation(parts[1]),
    };
  } else {
    throw new Error(`Invalid range format: ${range}`);
  }
}

/**
 * 2次元配列を正規化（すべての行を同じ長さにする）
 */
export function normalizeValues(values: CellValue[][]): CellValue[][] {
  if (values.length === 0) {
    return [];
  }
  
  const maxLength = Math.max(...values.map(row => row.length));
  
  return values.map(row => {
    const normalizedRow = [...row];
    while (normalizedRow.length < maxLength) {
      normalizedRow.push("");
    }
    return normalizedRow;
  });
}

/**
 * 値を文字列に変換（Google Sheets API用）
 */
export function valueToString(value: CellValue): string {
  if (typeof value === "string") {
    return value;
  } else if (typeof value === "number") {
    return value.toString();
  } else if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  } else {
    return String(value);
  }
}

/**
 * 文字列から適切な型に変換
 */
export function parseValue(value: string): CellValue {
  // 空文字列
  if (value === "") {
    return "";
  }
  
  // 数値
  const numValue = Number(value);
  if (!isNaN(numValue) && isFinite(numValue)) {
    return numValue;
  }
  
  // ブール値
  const lowerValue = value.toLowerCase();
  if (lowerValue === "true") {
    return true;
  } else if (lowerValue === "false") {
    return false;
  }
  
  // 文字列
  return value;
}
