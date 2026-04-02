import { Input } from "antd";
import { ChangeEvent, FC } from "react";

const { TextArea: TextAreaAnt } = Input;

type TextAreaProps = {
  rows: number;
  value: string;
  onChange: (value: string) => void;
};

export const TextArea: FC<TextAreaProps> = ({ rows, value, onChange }) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const technologies = event.target.value;
    onChange(technologies);
  };
  return <TextAreaAnt rows={rows} value={value} onChange={handleChange} />;
};
