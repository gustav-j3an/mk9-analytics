export function getDatesForWeekdayInMonth(year: number, month: number, weekday: string): Date[] {
  const weekdayMap: Record<string, number> = {
    SEG: 1,
    TER: 2,
    QUA: 3,
    QUI: 4,
    SEX: 5,
    SAB: 6,
    DOM: 0
  };

  const targetDay = weekdayMap[weekday.toUpperCase()];
  if (targetDay === undefined) return [];

  const dates: Date[] = [];
  // month is 1-indexed (1 to 12)
  const date = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));

  while (date.getUTCMonth() === month - 1) {
    if (date.getUTCDay() === targetDay) {
      dates.push(new Date(date));
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return dates;
}
