export const TableLink = () => {
  const tableLink = import.meta.env.VITE_TABLE_LINK ?? "";

  return (
    <a href={tableLink} target="_blank">
      Table
    </a>
  );
};
