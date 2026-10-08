import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Controls, Header, ButtonGroup, Block, Footer } from "./styles";
import { Button, Flex, message } from "antd";
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
import { ChangelogModal } from "@/modules/components/ChangelogModal";
import { BirthdaysModal } from "@/modules/components/BirthdaysModal";
import { Title } from "@/ui-kit/Typography";
import { Link } from "react-router-dom";
import { employees } from "@/modules/constants";
import { getHrmNameMatch } from "@/modules/utils/getHrmNameMatch";
import { getFileNameHrmMatch } from "@/modules/utils/getFileNameHrmMatch";
import { resolveEmployeeFromCvName } from "@/modules/utils/resolveEmployeeFromCvName";
import { resolveEmployeeFromFileName } from "@/modules/utils/resolveEmployeeFromFileName";
import { getMaxExperienceYears } from "@/modules/utils/getMaxExperienceYears";
import { formatAbbreviatedName } from "@/modules/utils/formatAbbreviatedName";
import { renameDriveFile } from "@/services/google-drive";
import { replaceTextInGoogleDoc } from "@/services/google-docs";

const isEmpty = <T extends object>(obj: T) => Object.keys(obj).length === 0;

export const MainPage = observer(() => {
  const {
    projects: {
      technologiesMap,
      fileName,
      name,
      table,
      sourceDocId,
      isNativeGoogleDoc,
      setFileName,
      setName,
    },
    auth,
  } = useStore();

  const [isApplyingRecommended, setIsApplyingRecommended] = useState(false);

  const hrmNameMatch = useMemo(() => getHrmNameMatch(name, employees), [name]);
  const fileNameHrmMatch = useMemo(() => getFileNameHrmMatch(fileName, employees), [fileName]);
  // The file name ("Surname Name", both in full) identifies the person more
  // reliably than the CV's "Name S." line, so the CV name is only a fallback.
  const resolvedCandidate = useMemo(
    () =>
      resolveEmployeeFromFileName(fileName, employees) ??
      resolveEmployeeFromCvName(name, employees),
    [fileName, name],
  );
  const candidateAge = resolvedCandidate?.dateOfBirth
    ? dayjs().diff(dayjs(resolvedCandidate.dateOfBirth), "year")
    : undefined;

  // The highest experience (in years) across the professional skills table -
  // HTML/JavaScript/TypeScript usually come out on top - appended to the
  // recommended file name, e.g. "Bulynka Uladzislau 7+".
  const maxExperienceYears = useMemo(() => getMaxExperienceYears(table), [table]);
  const recommendedFileName = useMemo(() => {
    if (!fileNameHrmMatch || fileNameHrmMatch.isMatch || !fileNameHrmMatch.recommendedFileName) {
      return undefined;
    }

    return maxExperienceYears !== undefined
      ? `${fileNameHrmMatch.recommendedFileName} ${maxExperienceYears}+`
      : fileNameHrmMatch.recommendedFileName;
  }, [fileNameHrmMatch, maxExperienceYears]);

  // CVs always show "First name + abbreviated surname" (e.g. "Uladzislau B."),
  // so the recommendation mirrors that format instead of a full last name.
  const recommendedCvName = hrmNameMatch?.recommendedEmployee
    ? formatAbbreviatedName(hrmNameMatch.recommendedEmployee)
    : undefined;

  const canApplyRecommended = Boolean(recommendedFileName || recommendedCvName);

  // A "forbidden" result means the signed-in token predates the Drive/Docs
  // write scopes (granted at sign-in) - re-requesting another consent popup
  // here would be redundant with that, so the fix is just to sign in again.
  const PERMISSION_HINT = "Sign out and sign back in to refresh your Google Drive permissions.";

  // Applies the recommended file name and CV name in place: when the CV was
  // imported from a Google Drive link, this edits the actual file in Drive
  // (renames it, and - for a native Google Doc - replaces the name text
  // inside its content); for a locally uploaded file, there's nothing on
  // disk to rename, so only the app's own state is updated.
  const handleApplyRecommended = async () => {
    if (!sourceDocId) {
      if (recommendedFileName) {
        const extension = fileName.match(/\.[^.]+$/)?.[0] ?? "";
        setFileName(`${recommendedFileName}${extension}`);
      }
      if (recommendedCvName) {
        setName(recommendedCvName);
      }
      return;
    }

    setIsApplyingRecommended(true);
    try {
      const accessToken = await auth.ensureGoogleAccessToken();
      if (!accessToken) {
        message.error("Google sign-in is required to update the file in Drive.");
        return;
      }

      let hadFailure = false;

      if (recommendedFileName) {
        // Native Google Doc titles don't carry a file extension; a binary
        // file (e.g. an uploaded .docx) stored in Drive keeps its own.
        const extension = isNativeGoogleDoc ? "" : fileName.match(/\.[^.]+$/)?.[0] ?? "";
        const newFileName = `${recommendedFileName}${extension}`;
        const renameResult = await renameDriveFile(sourceDocId, accessToken, newFileName);

        if (renameResult === "ok") {
          setFileName(newFileName);
        } else {
          hadFailure = true;
          message.error(
            renameResult === "forbidden"
              ? `Couldn't rename the file: missing Drive write permission. ${PERMISSION_HINT}`
              : "Failed to rename the file in Google Drive.",
          );
        }
      }

      if (recommendedCvName) {
        if (isNativeGoogleDoc) {
          const replaceResult = await replaceTextInGoogleDoc(
            sourceDocId,
            accessToken,
            name,
            recommendedCvName,
          );

          if (replaceResult === "ok") {
            setName(recommendedCvName);
          } else {
            hadFailure = true;
            message.error(
              replaceResult === "forbidden"
                ? `Couldn't update the name: missing Docs write permission. ${PERMISSION_HINT}`
                : "Failed to update the name inside the Google Doc.",
            );
          }
        } else {
          message.warning(
            "This file isn't a native Google Doc, so its text can't be edited automatically - only the file name was updated.",
          );
          setName(recommendedCvName);
        }
      }

      if (!hadFailure) {
        message.success("Recommended changes applied.");
      }
    } finally {
      setIsApplyingRecommended(false);
    }
  };

  if (isEmpty(technologiesMap)) {
    return (
      <div style={{ height: "100vh" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <ChangelogModal />
      <Header justify="space-between" align="center">
        {fileName ? (
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <Title
              level={5}
              style={{
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={`Source: ${fileName}`}
            >
              Source:{" "}
              {fileNameHrmMatch ? (
                <span style={{ color: fileNameHrmMatch.isMatch ? "#389e0d" : "#cf1322" }}>
                  {fileName}
                </span>
              ) : (
                fileName
              )}
              {recommendedFileName && (
                <span style={{ color: "#8c8c8c", fontWeight: 400, fontSize: "13px" }}>
                  {" "}
                  (Recommended: {recommendedFileName})
                </span>
              )}
              {candidateAge !== undefined && (
                <span style={{ color: "#8c8c8c", fontWeight: 400, fontSize: "13px" }}>
                  {" "}
                  ({candidateAge} y.o. Recommended {candidateAge - 18} years)
                </span>
              )}
            </Title>
            {name && hrmNameMatch && (
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#8c8c8c" }}> Name in CV: </span>
                <span style={{ color: hrmNameMatch.isMatch ? "#389e0d" : "#cf1322" }}>{name}</span>
                {!hrmNameMatch.isMatch && recommendedCvName && (
                  <span style={{ color: "#8c8c8c" }}>
                    (Recommended name from HRM: {recommendedCvName})
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div />
        )}
        <Flex gap={8} align="center">
          {canApplyRecommended && (
            <Button
              type="primary"
              onClick={handleApplyRecommended}
              loading={isApplyingRecommended}
              size="small"
            >
              Apply recommended
            </Button>
          )}
          <Button icon={<LogoutOutlined />} onClick={() => auth.signOut()} size="small">
            Logout ({auth.userDisplayName || auth.userEmail})
          </Button>
        </Flex>
      </Header>
      <LinkImport />

      <Controls>
        <ButtonGroup>
          <ReloadPageButton />
          <DocumentInput />
        </ButtonGroup>
        <ButtonGroup>
          {/* <GenerateDocumentButton /> */}
          {/* <GenerateBrightboxFormatDocumentButton /> */}
          {/* <ConnectDatabaseButton /> */}
          <RefetchDataButton />
          <BirthdaysModal />
          <TableLink />
          <BackgroundToggleCheckbox />
        </ButtonGroup>
      </Controls>
      <Block style={{ display: "flex", flexGrow: 1 }} justify="start">
        <ListProjects />
        <TableSection />
        <SummarizingField />
      </Block>
      <Footer>
        <Link to="/privacy">Privacy Policy</Link> | <Link to="/terms">Terms of Service</Link> |{" "}
        <Link to="/">Home</Link>
      </Footer>
    </div>
  );
});
