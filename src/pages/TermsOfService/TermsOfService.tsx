import { Typography, Layout } from "antd";
import { Link } from "react-router-dom";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export const TermsOfService = () => {
  return (
    <Layout style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <Content style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Title level={2}>Terms of Service</Title>
        <Paragraph>
          <strong>Last updated:</strong> April 3, 2026
        </Paragraph>

        <Title level={4}>1. Acceptance of Terms</Title>
        <Paragraph>
          By accessing or using CV Helper ("the Service"), you agree to be bound by these Terms of
          Service. If you disagree with any part of the terms, you may not access the Service.
        </Paragraph>

        <Title level={4}>2. Description of Service</Title>
        <Paragraph>
          CV Helper is a web application that helps users organize and manage CV/project data from
          Google Drive spreadsheets. The Service requires Google authentication to function.
        </Paragraph>

        <Title level={4}>3. Google Account Integration</Title>
        <Paragraph>
          To use our Service, you must authorize access to your Google account. We use Google OAuth
          2.0 for authentication and may request permission to access your Google Drive files. You
          can revoke this access at any time through your Google Account settings.
        </Paragraph>

        <Title level={4}>4. User Responsibilities</Title>
        <Paragraph>
          You are responsible for:
          <ul>
            <li>Maintaining the confidentiality of your account</li>
            <li>All activities that occur under your account</li>
            <li>Any content you upload, create, or modify using the Service</li>
            <li>Complying with all applicable laws and regulations</li>
          </ul>
        </Paragraph>

        <Title level={4}>5. Limitation of Liability</Title>
        <Paragraph>
          The Service is provided "as is" without warranties of any kind. We are not responsible for
          any loss of data or damages arising from the use of our Service.
        </Paragraph>

        <Title level={4}>6. Changes to Terms</Title>
        <Paragraph>
          We reserve the right to modify these terms at any time. We will provide notice of
          significant changes by updating the date at the top of these terms.
        </Paragraph>

        <Title level={4}>7. Contact Information</Title>
        <Paragraph>
          For any questions about these Terms, please contact:
          <br />
          <a href="mailto:daniil.shishaev@gmail.com">daniil.shishaev@gmail.com</a>
        </Paragraph>

        <Paragraph style={{ marginTop: "40px" }}>
          <Link to="/">← Back to Home</Link>
        </Paragraph>
      </Content>
    </Layout>
  );
};
