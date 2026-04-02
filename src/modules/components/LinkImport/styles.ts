import styled from "styled-components";

export const DocumentInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 600px;
`;

export const TextAreaStyled = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #4096ff;
    box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
  }

  &::placeholder {
    color: #bfbfbf;
  }
`;
