/**
 * Checks if a string matches the date format "dd.MM.yyyy"
 * @param dateString - The string to validate
 * @returns true if the string matches the format "dd.MM.yyyy", false otherwise
 */
export const checkDateFormat = (dateString: string): boolean => {
  const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  if (!dateRegex.test(dateString)) return false;

  const [, day, month, year] = dateString.match(dateRegex) || [];
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (monthNum < 1 || monthNum > 12) return false;
  if (dayNum < 1 || dayNum > 31) return false;
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  if (dayNum > daysInMonth) return false;

  return true;
};
