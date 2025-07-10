export const roundDecimals = (num: string, decimals = 2) => {
  return Math.abs(+parseFloat(num).toFixed(decimals));
};
