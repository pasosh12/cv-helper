import { observer } from "mobx-react-lite";
import { useStore } from "@/hooks";
import { Flex, Typography, message, Modal } from "antd";
import { normalizeString } from "@/modules/utils/normalizeString";
import { FC, useCallback, useMemo, useRef, useState } from "react";
import { ISummaryField } from "@/types/storeTypes";
import { Button } from "@/ui-kit/Button";
import { SummarySectionOutcome, updateSummaryInGoogleDoc } from "@/services/google-docs";

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

const SUMMARY_OUTCOME_LABELS: Record<SummarySectionOutcome["outcome"], string> = {
  updated: "updated",
  inserted: "added",
  removed: "removed",
};

const tableOfTechnologiesLink = import.meta.env.VITE_TABLE_LINK ?? "";

export const SummarizingField = observer(() => {
  const {
    projects: {
      summary,
      hasCollisions,
      duplicatedValues,
      notFoundTechnologies,
      fileName,
      sourceDocId,
      isNativeGoogleDoc,
    },
    auth,
  } = useStore();
  const isCvImported = Boolean(fileName);
  const [isUpdatingSummary, setIsUpdatingSummary] = useState(false);

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

  const handleUpdateSummary = async () => {
    if (!sourceDocId) return;

    setIsUpdatingSummary(true);
    try {
      const accessToken = await auth.ensureGoogleAccessToken();
      if (!accessToken) {
        message.error("Google sign-in is required to update the summary in Drive.");
        return;
      }

      const { result, rewritten, sections } = await updateSummaryInGoogleDoc(
        sourceDocId,
        accessToken,
        summary,
      );

      if (result === "ok") {
        if (!rewritten) {
          message.info("Summary is already up to date - nothing to change.");
          return;
        }
        if (sections.length === 0) {
          message.success("Summary formatting updated in the CV.");
          return;
        }

        message.success("Summary updated in the CV.");
        // Only the sections that actually changed, were added or removed -
        // makes it obvious what this click did to the doc.
        Modal.info({
          title: "Update Summary - details",
          width: 480,
          content: (
            <ul style={{ paddingLeft: 20 }}>
              {sections.map(({ sectionName, outcome }) => (
                <li key={sectionName}>
                  {sectionName}: <b>{SUMMARY_OUTCOME_LABELS[outcome]}</b>
                </li>
              ))}
            </ul>
          ),
        });
      } else if (result === "not-found") {
        message.error("Couldn't find any matching summary sections in this document to update.");
      } else if (result === "forbidden") {
        message.error(
          "Couldn't update the summary: missing Docs write permission. Sign out and sign back in to refresh your Google Drive permissions.",
        );
      } else {
        message.error("Failed to update the summary in the CV.");
      }
    } finally {
      setIsUpdatingSummary(false);
    }
  };

  return (
    <Flex vertical gap="small" align="stretch" style={{ flex: "1 1 280px", minWidth: 0 }}>
      {isCvImported && (
        <Flex gap="small" wrap="wrap">
          <Button onClick={handleCopy}>Copy Summary</Button>
          {sourceDocId && isNativeGoogleDoc && (
            <Button onClick={handleUpdateSummary} loading={isUpdatingSummary}>
              Update Summary
            </Button>
          )}
        </Flex>
      )}
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
