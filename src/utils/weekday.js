export const getWeekdayName = (dayNumber) => {
    const days = ['未定', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const parts = ['上午', '下午', '晚上', '下午后段', '晚上后段'];
    const day = Math.floor(dayNumber / 10);
    const part = dayNumber % 10;
    const dayStr = days[day] || days[0];
    const partStr = parts[part] || parts[0];
    return `${dayStr}${partStr}`;
};

