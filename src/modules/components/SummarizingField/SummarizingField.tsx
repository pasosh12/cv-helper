import { observer } from "mobx-react-lite";
import { useStore } from "@/hooks";
import { Flex, Typography, message } from "antd";
import { normalizeString } from "@/modules/utils/normalizeString";
import { FC, useCallback, useMemo, useRef } from "react";
import { ISummaryField } from "@/types/storeTypes";
import { Button } from "@/ui-kit/Button";

const { Title, Paragraph } = Typography;

type SummaryContentProps = {
  summary: ISummaryField;
  getDuplicatedColor: (value: string) => string | undefined;
};

const SummaryContent: FC<SummaryContentProps> = ({ summary, getDuplicatedColor }) => {
  return (
    <div>
      {Object.entries(summary).map(([key, valueArr]) => {
        if (valueArr.length === 0) return;
        return (
          <div key={key} style={{ marginLeft: "10px" }}>
            <Title
              level={3}
              style={{
                marginBottom: "3pt",
                marginTop: "0pt",
                lineHeight: "1.15",
                fontSize: "16px",
                fontFamily: '"Mulish", sans-serif',
                color: "#353535",
              }}
            >
              {key}
            </Title>
            <Paragraph
              style={{
                marginBottom: "10pt",
                lineHeight: "1.15",
                fontSize: "16px",
                fontFamily: '"Mulish", sans-serif',
                color: "#353535",
              }}
            >
              {valueArr.map((value, index, array) => {
                const color = getDuplicatedColor(value);
                return (
                  <span key={value + `${!!color}`}>
                    <span style={{ backgroundColor: color || "transparent" }}>{value}</span>
                    {index === array.length - 1 ? "." : ","}{" "}
                  </span>
                );
              })}
            </Paragraph>
          </div>
        );
      })}
    </div>
  );
};

const DUPLICATE_COLORS = ["#FFC1C1", "#C1FFC1", "#C1C1FF", "#FFFFC1", "#FFC1FF", "#C1FFFF"];

const tableOfTechnologiesLink = import.meta.env.VITE_TABLE_LINK ?? "";

export const SummarizingField = observer(() => {
  const {
    projects: { summary, hasCollisions, duplicatedValues, notFoundTechnologies },
  } = useStore();

  const normalizedDuplicatedValues = useMemo(
    () => duplicatedValues.map((item) => normalizeString(item)),
    [duplicatedValues],
  );

  const duplicatedColorMap = useMemo(() => {
    const map = new Map<string, string>();
    normalizedDuplicatedValues.forEach((value, index) => {
      map.set(value, DUPLICATE_COLORS[index % DUPLICATE_COLORS.length]);
    });
    return map;
  }, [normalizedDuplicatedValues]);

  const getDuplicatedColor = useCallback(
    (value: string) => {
      return duplicatedColorMap.get(normalizeString(value));
    },
    [duplicatedColorMap],
  );

  const summaryRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (!summaryRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNode(summaryRef.current);
    selection.removeAllRanges();
    selection.addRange(range);

    try {
      document.execCommand("copy");
      message.success("Summary copied to clipboard!");
    } catch (e) {
      message.error("Failed to copy summary.");
    } finally {
      selection.removeAllRanges();
    }
  };

  return (
    <Flex vertical gap="small" align="stretch" style={{ width: "30%" }}>
      <Button onClick={handleCopy}>Copy Summary (Please paste using Ctrl+V only)</Button>
      {hasCollisions && (
        <Paragraph
          style={{
            backgroundColor: "#e31717",
            padding: "10px",
            color: "#fff",
            fontSize: "20px",
          }}
        >
          Fields has duplicated technologies names above:
          <br />
          <b style={{ fontStyle: "normal", color: "#09f2f6" }}>{duplicatedValues.join(", ")}</b>
        </Paragraph>
      )}
      {notFoundTechnologies.length > 0 && (
        <Paragraph
          style={{
            backgroundColor: "#e31717",
            padding: "10px",
            color: "#fff",
            fontSize: "20px",
          }}
        >
          Table has not found technologies! Please add them to the{" "}
          <a
            href={tableOfTechnologiesLink}
            target="_blank"
            style={{ color: "#fff", textDecoration: "underline" }}
          >
            table of technologies
          </a>{" "}
          and refetch database:
          <br />
          <b style={{ fontStyle: "normal", color: "#09f2f6" }}>{notFoundTechnologies.join(", ")}</b>
        </Paragraph>
      )}
      <div ref={summaryRef}>
        <SummaryContent summary={summary} getDuplicatedColor={getDuplicatedColor} />
      </div>
    </Flex>
  );
});
