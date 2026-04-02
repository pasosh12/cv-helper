import { Flex, Spin } from "antd";

export const Spinner = () => {
  return (
    <Flex align="center" justify="center" style={{ height: "100%", width: "100%" }}>
      <Spin size="large" style={{ color: "#c63031" }} />
    </Flex>
  );
};
