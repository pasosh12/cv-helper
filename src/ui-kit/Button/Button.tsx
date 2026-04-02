import { FC } from "react";
import { Button as ButtonAnt, ButtonProps } from "antd";

export const Button: FC<ButtonProps> = (props) => {
  return <ButtonAnt {...props}>{props.children}</ButtonAnt>;
};
