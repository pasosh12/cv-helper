export const removeLastDot = (arr: string[]) => {
  const resultArr = [...arr];
  const lastCharLastElement = arr.at(-1)?.at(-1);

  if (lastCharLastElement === ".") {
    const lastElement = resultArr.pop();
    resultArr.push(lastElement?.slice(0, -1) as string);
  }

  return resultArr;
};
