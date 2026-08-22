import { useState } from "react";
import { Modal, Typography } from "antd";
import { changelog, CHANGELOG_VERSION } from "@/modules/constants";

const { Title, Paragraph, Text } = Typography;

const STORAGE_KEY = "cv-helper-changelog-seen-version";

const hasSeenLatestChangelog = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === CHANGELOG_VERSION;
  } catch {
    return true;
  }
};

const markChangelogAsSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, CHANGELOG_VERSION);
  } catch {
    // Ignore storage errors (e.g. private browsing) - modal will just reappear next time.
  }
};

export const ChangelogModal = () => {
  const [open, setOpen] = useState(() => !hasSeenLatestChangelog());

  const handleClose = () => {
    markChangelogAsSeen();
    setOpen(false);
  };

  return (
    <Modal
      title="What's new"
      open={open}
      onOk={handleClose}
      onCancel={handleClose}
      okText="Got it"
      cancelButtonProps={{ style: { display: "none" } }}
    >
      {changelog.map(({ date, items }) => (
        <div key={date} style={{ marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 4 }}>
            {date}
          </Title>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {items.map((item) => (
              <li key={item}>
                <Paragraph style={{ marginBottom: 4 }}>
                  <Text>{item}</Text>
                </Paragraph>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Modal>
  );
};
