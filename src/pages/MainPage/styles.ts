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
