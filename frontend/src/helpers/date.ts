export const getDaysLeft = (futureDate: Date) => {
  const now = new Date();
  const diffMs = futureDate.getTime() - now.getTime(); // convert both to milliseconds
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // ms to days

  return diffDays;
};

export const getHoursLeft = (futureDate: Date) => {
  const now = new Date();
  const diffMs = futureDate.getTime() - now.getTime(); // milliseconds difference
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60)); // convert to hours

  return diffHours;
};
