/**
 * Geographic utility functions for ClimaMedix
 */

export function normalizeCountryName(country, isArabic = true) {
  if (!country || typeof country !== 'string') return '';
  const trimmed = country.trim();
  const lower = trimmed.toLowerCase();

  // Normalize Palestinian Territories, Israel, West Bank, Gaza -> Palestine
  if (
    lower.includes('palestin') ||
    lower.includes('israel') ||
    lower.includes('west bank') ||
    lower.includes('gaza') ||
    lower.includes('فلسطين') ||
    lower.includes('إسرائيل')
  ) {
    return isArabic ? 'فلسطين' : 'Palestine';
  }

  return trimmed;
}
