import { Button, Card, Space, Typography, Layout, Row, Col } from "antd";
import { GoogleOutlined, FileTextOutlined, SafetyOutlined, SyncOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { useStore } from "@/hooks";

const { Title, Text, Paragraph } = Typography;
const { Content, Footer } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow-x: hidden;
  width: 100%;
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 80px 20px 60px;
`;

const FeatureCard = styled(Card)`
  height: 100%;
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .anticon {
    font-size: 48px;
    color: #1890ff;
    margin-bottom: 16px;
  }
`;

const StyledFooter = styled(Footer)`
  text-align: center;
  background: transparent;
  padding: 24px;

  a {
    color: #666;
    margin: 0 12px;
    text-decoration: none;

    &:hover {
      color: #1890ff;
      text-decoration: underline;
    }
  }
`;

export const LandingPage = observer(() => {
  const { auth } = useStore();

  return (
    <StyledLayout>
      <Content>
        <HeroSection>
          <Space direction="vertical" size="large" style={{ maxWidth: 600 }}>
            <Title level={1} style={{ margin: 0 }}>
              CV Helper
            </Title>
            <Paragraph style={{ fontSize: 18, color: "#555" }}>
              Streamline your CV management with Google Drive integration. Import, organize, and
              generate professional CV documents effortlessly.
            </Paragraph>
            {auth.isAuthenticated ? (
              <Link to="/app">
                <Button type="primary" size="large">
                  Go to App
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button type="primary" icon={<GoogleOutlined />} size="large">
                  Get Started with Google
                </Button>
              </Link>
            )}
          </Space>
        </HeroSection>

        <Row gutter={[24, 24]} justify="center" style={{ padding: "0 40px 60px" }}>
          <Col xs={24} sm={12} md={8}>
            <FeatureCard>
              <FileTextOutlined />
              <Title level={4}>Document Import</Title>
              <Text>Import CV data directly from Google Drive spreadsheets</Text>
            </FeatureCard>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <FeatureCard>
              <SyncOutlined />
              <Title level={4}>Real-time Sync</Title>
              <Text>Keep your CV data synchronized across all devices</Text>
            </FeatureCard>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <FeatureCard>
              <SafetyOutlined />
              <Title level={4}>Secure Access</Title>
              <Text>Your data is protected with Google OAuth authentication</Text>
            </FeatureCard>
          </Col>
        </Row>
      </Content>

      <StyledFooter>
        <Link to="/privacy">Privacy Policy</Link> | <Link to="/terms">Terms of Service</Link>
        <br />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
          © 2026 CV Helper. All rights reserved.
        </Text>
      </StyledFooter>
    </StyledLayout>
  );
});
