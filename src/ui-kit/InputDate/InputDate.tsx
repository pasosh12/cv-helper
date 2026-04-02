import { DatePicker } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import { Dayjs } from "dayjs";
import { FC } from "react";

const { RangePicker } = DatePicker;

type InputDateProps = {
  onChange: (firstDate: string, lastDate: string) => void;
  value: [Dayjs, Dayjs];
};

export const InputDate: FC<InputDateProps> = ({ onChange, value }) => {
  const handleChange: RangePickerProps["onChange"] = (_date, dateString) => {
    const [firstDate, lastDate] = dateString;
    onChange(firstDate, lastDate);
  };
  return (
    <RangePicker onChange={handleChange} picker="month" value={value} disabled={[false, true]} />
  );
};
