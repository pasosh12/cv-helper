import { Spin, Typography } from "antd";

const { Text } = Typography;

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader = ({ message }: FullPageLoaderProps) => {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f2f5",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Spin size="large" />
        {message && (
          <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
            {message}
          </Text>
        )}
      </div>
    </div>
  );
};
