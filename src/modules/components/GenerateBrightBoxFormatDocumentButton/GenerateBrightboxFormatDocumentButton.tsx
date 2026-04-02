import Docxtemplater from "docxtemplater";
import PizZip, { LoadData } from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";
import expressionParser from "docxtemplater/expressions";
import { Button } from "antd";
import { useStore } from "@/hooks";
import { observer } from "mobx-react-lite";
import { prepareProjectsData, prepareSummaryData } from "./utils";
function loadFile(url: string, callback: (err: Error, data: string) => void) {
  PizZipUtils.getBinaryContent(url, callback);
}

export const GenerateBrightboxFormatDocumentButton = observer(() => {
  const {
    projects: { name, roles, education, selfIntro, summary, projects },
  } = useStore();

  const generateDocument = () => {
    const preparedSummaryData = prepareSummaryData(summary);
    loadFile("/brightBoxTemplate.docx", function (error: Error, content: LoadData) {
      if (error) {
        throw error;
      }

      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        parser: expressionParser,
      });
      doc.render({
        name,
        roles,
        education,
        selfIntro,
        summary: preparedSummaryData,
        projects: prepareProjectsData(projects),
      });
      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }); //Output the document using Data-URI
      saveAs(out, `${name}.docx`);
    });
  };
  return <Button onClick={generateDocument}>Generate Brightbox</Button>;
});
