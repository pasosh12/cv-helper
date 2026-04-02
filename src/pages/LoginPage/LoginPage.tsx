import { observer } from "mobx-react-lite";
import { useStore } from "@/hooks";
import { Button, Card, Space, Typography, Alert, Spin } from "antd";
import { GoogleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export const LoginPage = observer(() => {
  const { auth } = useStore();

  const handleSignIn = async () => {
    try {
      await auth.signInWithGoogle();
    } catch {
      // Error is already handled in store
    }
  };

  if (auth.isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

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
      <Card style={{ width: 400, textAlign: "center" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Title level={2}>CV Helper</Title>
          <Text type="secondary">Sign in with Google to access your CV documents</Text>

          {auth.error && <Alert message={auth.error} type="error" showIcon closable />}

          <Button
            type="primary"
            icon={<GoogleOutlined />}
            size="large"
            onClick={handleSignIn}
            loading={auth.isLoading}
            style={{ width: "100%" }}
          >
            Sign in with Google
          </Button>

          <Text type="secondary" style={{ fontSize: "12px" }}>
            Your Google account must have access to the CV documents you want to import
          </Text>
        </Space>
      </Card>
    </div>
  );
});
