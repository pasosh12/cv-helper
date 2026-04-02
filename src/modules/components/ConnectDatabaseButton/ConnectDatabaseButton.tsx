import { useStore } from "@/hooks";
import { Button, Input, Modal } from "antd";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useState } from "react";

export const ConnectDatabaseButton = observer(() => {
  const {
    projects: { fetchTableData, setTableLink },
  } = useStore();
  const [open, setOpen] = useState(false);
  const [isLoadingConfirmed, setIsLoadingConfirmed] = useState(false);
  const [isError, setIsError] = useState(false);
  const [link, setLink] = useState("");

  const handleLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
  };

  const handleOk = async () => {
    try {
      setIsError(false);
      setIsLoadingConfirmed(true);

      await fetchTableData(link).then(() => {
        setTableLink(link);
        setOpen(false);
      });
    } catch (error) {
      setIsError(true);
      setLink("");
    } finally {
      setIsLoadingConfirmed(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Connect Database</Button>
      <Modal
        title="Enter Deployed Database Link"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        confirmLoading={isLoadingConfirmed}
      >
        <Input
          value={link}
          onChange={handleLinkChange}
          onClick={() => setIsError(false)}
          status={isError ? "error" : ""}
          placeholder={isError ? "Invalid Database URL" : ""}
        />
      </Modal>
    </>
  );
});
