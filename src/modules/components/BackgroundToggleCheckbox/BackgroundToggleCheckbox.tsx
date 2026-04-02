import { useState } from "react";
import { Switch } from "antd";
import { SwitchChangeEventHandler } from "antd/lib/switch";

export const BackgroundToggleCheckbox = () => {
  const [checked, setChecked] = useState(false);

  const handleChange: SwitchChangeEventHandler = (checked: boolean) => {
    setChecked(checked);

    if (checked) {
      // document.body.style.backgroundImage = "url('/innowise.jpg')";
      document.body.style.backgroundSize = "auto 100vh";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundPosition = "top";
      document.body.style.backgroundColor = "gray";
    } else {
      // document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "";
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ marginRight: 8 }}>Theme</span>
      <Switch checked={checked} onChange={handleChange} />
    </div>
  );
};
