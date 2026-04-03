import "./styles/global.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "./store";
import { MainPage } from "@/pages/MainPage";
import { LoginPage } from "@/pages/LoginPage";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { TermsOfService } from "@/pages/TermsOfService";
import { ThemeProvider } from "./theme";
import { useStore } from "@/hooks";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";

const AppRoutes = observer(() => {
  const { auth } = useStore();

  if (auth.isLoading) {
    return (
      <div
        style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route
        path="/"
        element={auth.isAuthenticated ? <MainPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/login"
        element={!auth.isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
});

function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </StoreProvider>
  );
}

export default App;
