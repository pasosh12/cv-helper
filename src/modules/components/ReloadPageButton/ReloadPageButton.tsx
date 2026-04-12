import { useStore } from "@/hooks";
import { Button } from "antd";
import { observer } from "mobx-react-lite";

export const ReloadPageButton = observer(() => {
  const {
    projects: { clearAll },
  } = useStore();

  return <Button onClick={clearAll}>Clear all</Button>;
});
