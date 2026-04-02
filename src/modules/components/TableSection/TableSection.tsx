import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { message } from "antd";
import { Table } from "@/components/Table";
import { useStore } from "@/hooks";
import { Button, Flex, Title } from "@/ui-kit";

export const TableSection = observer(() => {
  const {
    projects: { table },
  } = useStore();
  const tableRef = useRef<HTMLTableElement>(null);

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

  return (
    <Flex vertical gap="small" align="stretch" style={{ width: "40%" }}>
      <Flex justify="space-between" align="center">
        <Title level={3}>Professional skills</Title>
        <Button onClick={handleCopy}>Copy table</Button>
      </Flex>
      <Table technologies={table} ref={tableRef} />
    </Flex>
  );
});
