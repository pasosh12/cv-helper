export const normalizeString = (str: string) => {
  const regex = /[^a-zA-Z0-9]/;
  return str.toLowerCase().split(regex).join("");
};
