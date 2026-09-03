import { describe, it, expect } from "vitest";
import {
  naturalWeekOf,
  teachingWeekOf,
  weekLabel,
  resolveSchedule,
} from "../../src/utils/courseWeek.js";

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

describe("naturalWeekOf", () => {
  // 2025-02-24 is a Monday; week 4 starts exactly 21 days later.
  const semester = { start: "2025-02-24", end: "2025-07-06" };

  it("returns the 1-based natural week for a date inside the semester", () => {
    expect(naturalWeekOf(semester, new Date(2025, 2, 17))).toBe(4); // +21d
    expect(naturalWeekOf(semester, new Date(2025, 1, 24))).toBe(1); // start day
    expect(naturalWeekOf(semester, new Date(2025, 2, 10))).toBe(3); // +14d
  });

  it("returns null outside the semester range", () => {
    expect(naturalWeekOf(semester, new Date(2025, 1, 23))).toBeNull();
    expect(naturalWeekOf(semester, new Date(2025, 6, 7))).toBeNull();
  });

  it("returns null for missing or invalid semester data", () => {
    expect(naturalWeekOf(null)).toBeNull();
    expect(naturalWeekOf({})).toBeNull();
    expect(naturalWeekOf({ start: "not-a-date", end: "2025-07-06" })).toBeNull();
  });

  it("defaults to 'today' when no date is given (wide range)", () => {
    const now = new Date();
    const in30 = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30));
    const minus30 = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30));
    const week = naturalWeekOf({ start: minus30, end: in30 });
    expect(week).toBeGreaterThanOrEqual(1);
    expect(week).toBeLessThanOrEqual(9);
  });
});

describe("teachingWeekOf / weekLabel", () => {
  it("are exact inverses for any lag", () => {
    for (const lag of [0, 1, 2, 5]) {
      for (const natural of [1, 4, 16]) {
        const teaching = teachingWeekOf(natural, lag);
        expect(weekLabel(teaching, lag)).toBe(natural);
      }
    }
  });

  it("matches the backend derivation (natural - lag)", () => {
    expect(teachingWeekOf(4, 1)).toBe(3);
    expect(teachingWeekOf(4, 0)).toBe(4);
    expect(teachingWeekOf(2, 3)).toBe(-1); // class has not started yet
  });
});

describe("resolveSchedule", () => {
  const schedules = [
    { id: 10, week: 1, name: "week1" },
    { id: 20, week: 3, name: "week3" },
    { id: 30, week: 4, name: "week4" },
  ];

  it("finds the schedule for a teaching week", () => {
    expect(resolveSchedule(schedules, 3)).toEqual({ id: 20, week: 3, name: "week3" });
  });

  it("returns null when no schedule exists for the week", () => {
    expect(resolveSchedule(schedules, 2)).toBeNull();
    expect(resolveSchedule([], 1)).toBeNull();
    expect(resolveSchedule(null, 1)).toBeNull();
  });
});
