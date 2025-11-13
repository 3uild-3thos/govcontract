export const roundDecimals = (num: string, decimals = 2) => {
  return Math.abs(+parseFloat(num).toFixed(decimals));
};

export const humanizeText = (text: string) => {
  return text
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
