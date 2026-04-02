import dayjs from "dayjs";

export const calculateDateRange = (firstDate: string, lastDate: string) => {
  return dayjs(lastDate).diff(firstDate, "month");
};
