import { Flex as FlexAntd } from "antd";
import styled from "styled-components";

export const Controls = styled(FlexAntd)`
  & {
    padding: 30px 50px 0;
    justify-content: space-between;
    align-items: center;
  }
`;
export const Block = styled(FlexAntd)`
  & {
    padding: 30px 50px 0;
  }
`;
export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const Header = styled(FlexAntd)`
  & {
    padding: 15px 0 0 50px;
  }
`;

export const Footer = styled.footer`
  & {
    padding: 20px 50px;
    margin-top: 40px;
    border-top: 1px solid #e8e8e8;
    text-align: center;
    color: #666;
    font-size: 14px;

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
