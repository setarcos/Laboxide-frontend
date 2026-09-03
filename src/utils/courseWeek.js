// Single source of truth for the week arithmetic shared with the Laboxide
// backend. The backend derives the current week of a subcourse as
//
//   naturalWeek = floor((today - semester.start) / 7days) + 1
//   schedule.week = teachingWeek = naturalWeek - lag_week
//
// where `lag_week` is how many weeks later the class starts than the
// semester. Convention used everywhere in the UI:
//   - schedule lookups / option values use the TEACHING week;
//   - labels shown to users use the NATURAL week.

/**
 * 1-based natural week of `now` inside the semester, or `null` when the
 * semester is missing/invalid or `now` is outside its [start, end] range.
 *
 * The day difference is computed from calendar dates (UTC-normalised) rather
 * than milliseconds between local midnights, so daylight-saving time cannot
 * skew the result — matching the backend's NaiveDate arithmetic.
 */
export function naturalWeekOf(semester, now = new Date()) {
  if (!semester || !semester.start || !semester.end) {
    return null;
  }
  try {
    const nowDate = new Date(now);
    const startDate = new Date(semester.start);
    const endDate = new Date(semester.end);

    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      isNaN(nowDate.getTime())
    ) {
      return null;
    }

    // Calendar-day numbers (UTC) of the date parts only.
    const dayNumber = (d) =>
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const nowDay = dayNumber(nowDate);
    const startDay = dayNumber(startDate);
    const endDay = dayNumber(endDate);

    if (nowDay < startDay || nowDay > endDay) {
      return null;
    }

    const diffDays = Math.floor((nowDay - startDay) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  } catch (e) {
    console.error("Error calculating current week:", e);
    return null;
  }
}

/** Teaching week (schedule.week coordinate) for a natural week of the semester. */
export function teachingWeekOf(naturalWeek, lagWeek = 0) {
  return naturalWeek - (lagWeek || 0);
}

/** Natural week shown to users for a teaching week (inverse of teachingWeekOf). */
export function weekLabel(teachingWeek, lagWeek = 0) {
  return teachingWeek + (lagWeek || 0);
}

/** Find the schedule of a course whose week equals the given teaching week. */
export function resolveSchedule(schedules, teachingWeek) {
  return (schedules || []).find((s) => s.week === teachingWeek) || null;
}
