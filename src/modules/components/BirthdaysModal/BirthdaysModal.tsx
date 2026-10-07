import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import dayjs from "dayjs";
import { Empty, Input, Modal, Typography } from "antd";
import { useStore } from "@/hooks";
import { employees } from "@/modules/constants";
import { findEmployeeByName } from "@/modules/utils/findEmployeeByName";
import { normalizeString } from "@/modules/utils/normalizeString";
import { Button } from "@/ui-kit/Button";

const { Text } = Typography;

const formatDateOfBirth = (dateOfBirth: string) => {
  const age = dayjs().diff(dayjs(dateOfBirth), "year");
  return `${dayjs(dateOfBirth).format("D MMMM YYYY")} (${age})`;
};

export const BirthdaysModal = observer(() => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    projects: { name },
  } = useStore();

  // The candidate currently loaded from an uploaded CV (if we can match them
  // in the roster) is highlighted in the list below.
  const loadedEmployee = useMemo(() => findEmployeeByName(name, employees), [name]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = normalizeString(search);

    if (!normalizedSearch) {
      return employees;
    }

    return employees.filter((employee) =>
      normalizeString(`${employee.firstName} ${employee.lastName}`).includes(normalizedSearch),
    );
  }, [search]);

  const handleClose = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Birthdays</Button>
      <Modal title="Birthdays" open={open} onCancel={handleClose} footer={null} width={480}>
        <Input.Search
          placeholder="Search by name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
          autoFocus
          style={{ marginBottom: 12 }}
        />
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {filteredEmployees.length === 0 && <Empty description="No matches" />}
          {filteredEmployees.map((employee) => {
            const isLoadedCandidate = loadedEmployee?.id === employee.id;

            return (
              <div
                key={employee.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                  padding: "6px 4px",
                  borderBottom: "1px solid #f0f0f0",
                  background: isLoadedCandidate ? "#fffbe6" : "transparent",
                }}
              >
                <Text strong={isLoadedCandidate}>
                  {employee.firstName} {employee.lastName}
                </Text>
                <Text type="secondary">
                  {employee.dateOfBirth ? formatDateOfBirth(employee.dateOfBirth) : "—"}
                </Text>
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
});
