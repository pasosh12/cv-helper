import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import { message, Segmented } from "antd";
import { Table } from "@/components/Table";
import { useStore } from "@/hooks";
import { Button, Flex, Title } from "@/ui-kit";
import { getBroadTable } from "@/store/helpers";
import { updateTechnologiesTableInGoogleDoc } from "@/services/google-docs";

type TableGrouping = "default" | "hays";

export const TableSection = observer(() => {
  const {
    projects: { table, fileName, sourceDocId, isNativeGoogleDoc },
    auth,
  } = useStore();
  const isCvImported = Boolean(fileName);
  const tableRef = useRef<HTMLTableElement>(null);
  const [grouping, setGrouping] = useState<TableGrouping>("default");
  const [isUpdatingTable, setIsUpdatingTable] = useState(false);

  const displayedTable = useMemo(
    () => (grouping === "hays" ? getBroadTable(table) : table),
    [grouping, table],
  );

  const handleCopy = () => {
    if (tableRef.current) {
      const range = document.createRange();
      range.selectNode(tableRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.execCommand("copy");
      window.getSelection()?.removeAllRanges();
      message.success("Table copied!");
    }
  };

  const handleUpdateTable = async () => {
    if (!sourceDocId) return;

    setIsUpdatingTable(true);
    try {
      const accessToken = await auth.ensureGoogleAccessToken();
      if (!accessToken) {
        message.error("Google sign-in is required to update the table in Drive.");
        return;
      }

      const result = await updateTechnologiesTableInGoogleDoc(
        sourceDocId,
        accessToken,
        displayedTable,
      );

      if (result === "ok") {
        message.success("Table updated in the CV.");
      } else if (result === "not-found") {
        message.error("Couldn't find a table in this document to update.");
      } else if (result === "forbidden") {
        message.error(
          "Couldn't update the table: missing Docs write permission. Sign out and sign back in to refresh your Google Drive permissions.",
        );
      } else {
        message.error("Failed to update the table in the CV.");
      }
    } finally {
      setIsUpdatingTable(false);
    }
  };

  return (
    <Flex vertical gap="small" align="stretch" style={{ flex: "1 1 340px", minWidth: 0 }}>
      <Flex justify="space-between" align="center" gap="small" wrap="wrap">
        <Title level={3} style={{ margin: 0 }}>
          Professional skills
        </Title>
        {isCvImported && (
          <Flex gap="small" align="center" wrap="wrap">
            <Segmented
              value={grouping}
              onChange={(value) => setGrouping(value as TableGrouping)}
              options={[
                { label: "Default", value: "default" },
                { label: "Hays", value: "hays" },
              ]}
            />
            <Button onClick={handleCopy}>Copy table</Button>
            {sourceDocId && isNativeGoogleDoc && (
              <Button onClick={handleUpdateTable} loading={isUpdatingTable}>
                Update table
              </Button>
            )}
          </Flex>
        )}
      </Flex>
      <Table technologies={displayedTable} ref={tableRef} />
    </Flex>
  );
});
