const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

export function sanitizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  let str = String(value);

  if (FORMULA_PREFIXES.some(prefix => str.startsWith(prefix))) {
    str = "'" + str;
  }

  if (/[",\n\r]/.test(str)) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

export function csvRow(values: unknown[]): string {
  return values.map(sanitizeCsvValue).join(',') + '\n';
}
