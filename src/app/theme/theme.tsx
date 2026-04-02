import { ConfigProvider, ThemeConfig } from "antd";
import { FC, ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
};

const themeConfig: ThemeConfig = {
  token: {
    fontFamilyCode: "Mulish",
    fontFamily: "Mulish, sans-serif",
    colorText: "#353535",
    colorSuccess: "#c63031",
  },
};

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>;
};
