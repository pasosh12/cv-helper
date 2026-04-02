export const convertMonthsToYears = (months: number | string) => {
  const monthsAsNumber = Number(months);

  if (isNaN(monthsAsNumber))
    throw new Error("error in convertMonthsToYears, argument has NaN value");

  if (monthsAsNumber < 6) return 1;
  return Math.round(monthsAsNumber / 12);
};
