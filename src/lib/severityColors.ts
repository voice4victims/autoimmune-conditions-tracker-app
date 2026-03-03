export function getSeverityColor(severity: number): { text: string; bg: string; border: string } {
  if (severity <= 2) return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' };
  if (severity <= 6) return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' };
  if (severity <= 8) return { text: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300' };
  return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' };
}
