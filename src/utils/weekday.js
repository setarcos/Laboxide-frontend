export const getWeekdayName = (dayNumber) => {
  const days = ['未定', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const parts = ['上午', '下午', '晚上', '下午后段', '晚上后段'];
  const day = Math.floor(dayNumber / 10);
  const part = dayNumber % 10;
  const dayStr = days[day] || days[0];
  const partStr = parts[part] || parts[0];
  return `${dayStr}${partStr}`;
};

export function calculateCurrentWeek(semester) {
  if (!semester || !semester.start || !semester.end) {
    return null;
  }

  try {
    const now = new Date();
    const startDate = new Date(semester.start);
    const endDate = new Date(semester.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null;
    }

    now.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (now < startDate || now > endDate) {
      return null;
    }

    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  } catch (e) {
    console.error("Error calculating current week:", e);
    return null;
  }
}
