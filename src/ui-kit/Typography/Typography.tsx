import { FC } from "react";
import { Typography } from "antd";
import { TitleProps } from "antd/es/typography/Title";
import { TextProps } from "antd/es/typography/Text";

const { Title: TitleAnt, Text: TextAnt } = Typography;

// Fluid font sizes (clamp between a mobile-safe minimum and antd's default desktop size)
// so headings shrink gracefully instead of overflowing/wrapping oddly at narrow widths or zoom.
const FLUID_TITLE_FONT_SIZE: Record<number, string> = {
  1: "clamp(1.75rem, 1.1rem + 2.5vw, 2.375rem)",
  2: "clamp(1.5rem, 1rem + 2vw, 1.875rem)",
  3: "clamp(1.15rem, 0.95rem + 1vw, 1.5rem)",
  4: "clamp(1.05rem, 0.9rem + 0.6vw, 1.25rem)",
  5: "clamp(1rem, 0.9rem + 0.3vw, 1rem)",
};

export const Title: FC<TitleProps> = ({ level = 1, style, ...props }) => {
  return (
    <TitleAnt
      {...props}
      level={level}
      style={{ fontSize: FLUID_TITLE_FONT_SIZE[level], ...style }}
    />
  );
};

export const Text: FC<TextProps> = (props) => {
  return <TextAnt {...props}>{props.children}</TextAnt>;
};
