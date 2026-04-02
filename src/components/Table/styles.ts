import styled from "styled-components";

const Td = styled.td<{ $width?: string; $textAlign: string }>`
  border-top: 2px solid #c63031;
  border-bottom: 2px solid #cccccc;
  border-left: 1px solid white;
  border-right: 1px solid white;
  padding-bottom: 13px;
  width: ${(props) => props.width};
  text-align: ${(props) => props.$textAlign};
`;

const P = styled.p<{ $fontWeight?: string; $color: string }>`
  margin: 14px 20px;
  font-weight: ${(props) => props.$fontWeight};
  color: ${(props) => props.$color};
`;

export { Td, P };
