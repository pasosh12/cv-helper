import { Flex as FlexAntd } from "antd";
import styled from "styled-components";

export const Controls = styled(FlexAntd)`
  & {
    padding: clamp(16px, 3vw, 30px) clamp(16px, 5vw, 50px) 0;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
`;
export const Block = styled(FlexAntd)`
  & {
    padding: clamp(16px, 3vw, 30px) clamp(16px, 5vw, 50px) 0;
    flex-wrap: wrap;
    gap: clamp(24px, 4vw, 100px);
  }
`;
export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

export const Header = styled(FlexAntd)`
  & {
    padding: clamp(10px, 2vw, 15px) clamp(16px, 5vw, 50px) 0;
    flex-wrap: wrap;
    gap: 10px;
  }
`;

export const Footer = styled.footer`
  & {
    padding: 20px clamp(16px, 5vw, 50px);
    margin-top: 40px;
    border-top: 1px solid #e8e8e8;
    text-align: center;
    color: #666;
    font-size: clamp(12px, 0.8rem + 0.2vw, 14px);

    a {
      color: #666;
      text-decoration: none;
      margin: 0 10px;

      &:hover {
        color: #1890ff;
        text-decoration: underline;
      }
    }
  }
`;
