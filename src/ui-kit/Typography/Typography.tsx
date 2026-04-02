import { FC } from "react";
import { Typography } from "antd";
import { TitleProps } from "antd/es/typography/Title";
import { TextProps } from "antd/es/typography/Text";

const { Title: TitleAnt, Text: TextAnt } = Typography;

export const Title: FC<TitleProps> = (props) => {
  return <TitleAnt {...props}>{props.children}</TitleAnt>;
};

export const Text: FC<TextProps> = (props) => {
  return <TextAnt {...props}>{props.children}</TextAnt>;
};
