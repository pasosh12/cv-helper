import { useStore } from "@/hooks";
import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";

export const RefetchDataButton = observer(() => {
  const {
    projects: { fetchTableData },
  } = useStore();
  const [isLoading, setLoading] = useState(false);

  return (
    <Button
      onClick={async () => {
        setLoading(true);
        await fetchTableData();
        setLoading(false);
      }}
      disabled={isLoading}
    >
      Refetch Database
    </Button>
  );
});
