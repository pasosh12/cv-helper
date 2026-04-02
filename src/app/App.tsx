import "./styles/global.css";
import { StoreProvider } from "./store";
import { MainPage } from "@/pages/MainPage";
import { LoginPage } from "@/pages/LoginPage";
import { ThemeProvider } from "./theme";
import { useStore } from "@/hooks";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";

const AppContent = observer(() => {
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

  return auth.isAuthenticated ? <MainPage /> : <LoginPage />;
});

function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </StoreProvider>
  );
}

export default App;
