import { Controls, Header, ButtonGroup, Block } from "./styles";
import { Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { ListProjects } from "@/modules/components/ListProjects";
import { TableSection } from "@/modules/components/TableSection";
import { ReloadPageButton } from "@/modules/components/ReloadPageButton";
// import { GenerateDocumentButton } from "@/modules/components/GenerateDocumentButton";
import { SummarizingField } from "@/modules/components/SummarizingField";
import { useStore } from "@/hooks";
import { observer } from "mobx-react-lite";
import { Spinner } from "@/ui-kit/Spinner";
import { TableLink } from "@/components/TableLink";
import { RefetchDataButton } from "@/modules/components/RefetchDataButton";
import { DocumentInput } from "@/modules/components/DocumentInput";
import { LinkImport } from "@/modules/components/LinkImport";
import { BackgroundToggleCheckbox } from "@/modules/components/BackgroundToggleCheckbox";
import { Title } from "@/ui-kit/Typography";
// import { GenerateBrightboxFormatDocumentButton } from "@/modules/components/GenerateBrightBoxFormatDocumentButton";
// import { BackgroundToggleCheckbox } from "@/modules/components/BackgroundToggleCheckbox";
// import { ConnectDatabaseButton } from "@/modules/components/ConnectDatabaseButton";

const isEmpty = <T extends object>(obj: T) => Object.keys(obj).length === 0;

export const MainPage = observer(() => {
  const {
    projects: { technologiesMap, fileName },
    auth,
  } = useStore();

  if (isEmpty(technologiesMap)) {
    return (
      <div style={{ height: "100vh" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Header justify="space-between" align="center">
        {fileName ? (
          <Title level={5} style={{ margin: "0", whiteSpace: "pre" }}>
            Source: {fileName}
          </Title>
        ) : (
          <div />
        )}
        <Button icon={<LogoutOutlined />} onClick={() => auth.signOut()} size="small">
          Logout ({auth.userDisplayName || auth.userEmail})
        </Button>
      </Header>
      <LinkImport />

      <Controls gap={10}>
        <ButtonGroup>
          <ReloadPageButton />
          <DocumentInput />
        </ButtonGroup>
        <ButtonGroup>
          {/* <GenerateDocumentButton /> */}
          {/* <GenerateBrightboxFormatDocumentButton /> */}
          {/* <ConnectDatabaseButton /> */}
          <RefetchDataButton />
          <TableLink />
          <BackgroundToggleCheckbox />
        </ButtonGroup>
      </Controls>
      <Block gap={100} justify="start">
        <ListProjects />
        <TableSection />
        <SummarizingField />
      </Block>
    </>
  );
});
