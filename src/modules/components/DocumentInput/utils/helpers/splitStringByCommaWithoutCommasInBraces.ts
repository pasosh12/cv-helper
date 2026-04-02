export const splitStringByCommaWithoutCommasInBraces = (str: string) => {
  const result = [];
  let currentSegment = "";
  let insideParentheses = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === "(") {
      insideParentheses++;
      currentSegment += char;
    } else if (char === ")") {
      insideParentheses--;
      currentSegment += char;
    } else if (char === "," && insideParentheses === 0) {
      result.push(currentSegment.trim());
      currentSegment = "";
    } else {
      currentSegment += char;
    }
  }

  // Добавляем последний сегмент, если он не пуст
  if (currentSegment) {
    result.push(currentSegment.trim());
  }

  return result;
};
