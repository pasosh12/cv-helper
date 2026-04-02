import { useStore } from "@/hooks";
import { calculateDateRange } from "@/modules/utils/calculateDateRange";
import mammoth from "mammoth";
import { observer } from "mobx-react-lite";
import { ChangeEventHandler, useRef } from "react";
import { findProjectsData, findSelfInfo } from "./utils";
import { Button, Flex, Modal } from "antd";

export const DocumentInput = observer(() => {
  const {
    projects: { clearStore, addProject, addSelfInfo, setFileName },
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0] || null;

    // Clear input value so the exact same file can be uploaded again
    if (event.target) {
      event.target.value = "";
    }

    async function convertDocxToHtml(arrayBuffer: ArrayBuffer) {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return result.value;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const result = await convertDocxToHtml(arrayBuffer);

        if (/[\u0400-\u04FF]/.test(result)) {
          const cleanText = result.replace(/<\/?[^>]+(>|$)/g, " ");
          const cyrillicMatches = Array.from(
            cleanText.matchAll(/(.{0,40})([\u0400-\u04FF]+)(.{0,40})/g),
          );
          const totalOccurrences = cyrillicMatches.length;
          const contexts = cyrillicMatches.slice(0, 10).map((m, i) => (
            <li key={i} style={{ marginBottom: "8px", wordBreak: "break-word" }}>
              ...{m[1]}
              <span
                style={{
                  backgroundColor: "#ffccc7",
                  color: "#cf1322",
                  padding: "0 4px",
                  borderRadius: "2px",
                  fontWeight: "bold",
                }}
              >
                {m[2]}
              </span>
              {m[3]}...
            </li>
          ));

          const hasMore = totalOccurrences > 10;

          clearStore();

          Modal.error({
            title: "Cyrillic characters detected!",
            width: 650,
            content: (
              <div style={{ marginTop: "16px" }}>
                <p>
                  Please remove all Cyrillic characters from the document and upload it again to
                  continue.
                </p>
                <p style={{ marginTop: "16px", marginBottom: "8px" }}>
                  <strong>
                    Found {totalOccurrences} occurrences{hasMore ? " (showing first 10)" : ""}:
                  </strong>
                </p>
                <ul
                  style={{
                    background: "#f5f5f5",
                    padding: "12px 12px 12px 32px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {contexts}
                </ul>
              </div>
            ),
            okText: "OK",
          });
          return;
        }

        const projects = findProjectsData(result);
        const selfInfo = findSelfInfo(result);

        clearStore();
        setFileName(file.name);
        addSelfInfo(selfInfo);
        projects.forEach((item) => {
          addProject({
            id: 0,
            firstDate: item.dates[0],
            lastDate: item.dates[1],
            dateRange: calculateDateRange(item.dates[0], item.dates[1]),
            technologies: item.technologies,
            name: item.name,
            responsibilities: item.responsibilities,
            description: item.description,
          });
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <Flex gap={10} align="center">
      <Button onClick={() => fileInputRef.current?.click()}>Upload Document</Button>
      <input
        ref={fileInputRef}
        id="fileInput"
        type="file"
        onChange={handleFileChange}
        hidden={true}
      />
    </Flex>
  );
});
