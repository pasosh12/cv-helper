import dayjs from "dayjs";
import { dateFormat } from "../constants";

export const getCurrentMonth = () => {
  return dayjs().format(dateFormat);
};
