export function formatNumber(num: number): string {
  if (num < 1000) {
    return Math.floor(num).toString();
  }

  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  const magnitude = Math.floor(Math.log10(num) / 3);
  const suffix = suffixes[Math.min(magnitude, suffixes.length - 1)];
  const scaled = num / Math.pow(1000, Math.min(magnitude, suffixes.length - 1));

  if (scaled >= 100) {
    return `${Math.floor(scaled)}${suffix}`;
  } else if (scaled >= 10) {
    return `${scaled.toFixed(1)}${suffix}`;
  } else {
    return `${scaled.toFixed(2)}${suffix}`;
  }
}

export function formatIncome(income: number): string {
  return `${formatNumber(income)}/s`;
}
