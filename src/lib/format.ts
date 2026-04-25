/**
 * Formats a number or string into a Rupiah formatted string with dots as thousand separators.
 * Example: 50000 -> 50.000
 */
export const formatRupiah = (value: string | number): string => {
  if (!value && value !== 0) return "";
  const stringValue = value.toString().replace(/\D/g, "");
  if (!stringValue) return "";
  return parseInt(stringValue, 10).toLocaleString("id-ID");
};

/**
 * Removes all non-digit characters from a string.
 * Example: 50.000 -> 50000
 */
export const unformatRupiah = (value: string): string => {
  return value.replace(/\D/g, "");
};
