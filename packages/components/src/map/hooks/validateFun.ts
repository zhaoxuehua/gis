// 时间限制
export function disabledDateFun(time: Date) {
  const currentTime = new Date().getTime();
  const twoWeeksAgo = currentTime - 1000 * 3600 * 24 * 14;
  return time.getTime() < twoWeeksAgo || time.getTime() > currentTime;
}
