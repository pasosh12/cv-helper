import { FC } from "react";
import { Flex as FlexAnt, FlexProps } from "antd";

export const Flex: FC<FlexProps> = (props) => {
  return <FlexAnt {...props}>{props.children}</FlexAnt>;
};
