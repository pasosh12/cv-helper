import { Typography, Layout } from "antd";
import { Link } from "react-router-dom";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export const PrivacyPolicy = () => {
  return (
    <Layout style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <Content style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Title level={2}>Privacy Policy</Title>
        <Paragraph>
          <strong>Last updated:</strong> April 3, 2026
        </Paragraph>

        <Title level={4}>1. Information We Collect</Title>
        <Paragraph>
          We collect information you provide directly to us when using our CV Helper application.
          This includes your Google account information (name, email) when you sign in, and any data
          you upload or create within the application.
        </Paragraph>

        <Title level={4}>2. How We Use Your Information</Title>
        <Paragraph>
          We use the information we collect to:
          <ul>
            <li>Provide and maintain our services</li>
            <li>Authenticate your identity via Google Sign-In</li>
            <li>Access your Google Drive files (only with your explicit permission)</li>
            <li>Improve our application functionality</li>
          </ul>
        </Paragraph>

        <Title level={4}>3. Google User Data</Title>
        <Paragraph>
          Our application uses Google OAuth to access your Google Drive files. We only access the
          specific files you select and do not store your files on our servers. Your Google account
          credentials are handled securely through Firebase Authentication.
        </Paragraph>

        <Title level={4}>4. Data Security</Title>
        <Paragraph>
          We implement appropriate security measures to protect your personal information. However,
          no method of transmission over the internet is 100% secure.
        </Paragraph>

        <Title level={4}>5. Contact Us</Title>
        <Paragraph>
          If you have any questions about this Privacy Policy, please contact us at:
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
