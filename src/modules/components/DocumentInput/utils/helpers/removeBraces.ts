export const removeBraces = (arr: string[]) => {
  const findBracesRegExp = /\([^()]*\)/;
  return arr.map((item) => item.replace(findBracesRegExp, ""));
};
