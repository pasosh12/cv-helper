import { capitalize } from "@/modules/utils/capitalize";
import { convertMonthsToYears } from "@/modules/utils/convertMonthsToYears";
import { normalizeString } from "@/modules/utils/normalizeString";
import { ITechnologiesTableData } from "@/types/storeTypes";
import { DriveWriteResult } from "./google-drive";

const DOCS_API_BASE = "https://docs.googleapis.com/v1/documents";

// Narrow slice of the Docs API's document JSON shape - just enough to find
// headings/tables and the insertion point of each table cell.
interface DocsTextRun {
  content: string;
}
interface DocsParagraphElement {
  textRun?: DocsTextRun;
}
interface DocsParagraph {
  elements: DocsParagraphElement[];
}
interface DocsTableCell {
  startIndex: number;
  endIndex: number;
  content: DocsStructuralElement[];
}
interface DocsTableRow {
  tableCells: DocsTableCell[];
}
interface DocsTable {
  rows: number;
  columns: number;
  tableRows: DocsTableRow[];
}
interface DocsStructuralElement {
  startIndex: number;
  endIndex: number;
  paragraph?: DocsParagraph;
  table?: DocsTable;
}
interface DocsDocument {
  body: { content: DocsStructuralElement[] };
}

async function batchUpdate(
  docId: string,
  accessToken: string,
  requests: object[],
): Promise<DriveWriteResult> {
  try {
    const response = await fetch(`${DOCS_API_BASE}/${docId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    });
    if (response.ok) return "ok";
    return response.status === 403 ? "forbidden" : "error";
  } catch {
    return "error";
  }
}

/**
 * Replaces every occurrence of `oldText` with `newText` inside a native
 * Google Doc's content, via the Docs API's batchUpdate (ReplaceAllText).
 * Only works for native Google Docs, not binary files (e.g. .docx) stored
 * in Drive - those have no Docs API representation to edit.
 */
export async function replaceTextInGoogleDoc(
  docId: string,
  accessToken: string,
  oldText: string,
  newText: string,
): Promise<DriveWriteResult> {
  if (!oldText.trim() || oldText === newText) {
    return "ok";
  }

  return batchUpdate(docId, accessToken, [
    {
      replaceAllText: {
        containsText: { text: oldText, matchCase: false },
        replaceText: newText,
      },
    },
  ]);
}

type GetDocumentResult =
  | { ok: true; document: DocsDocument }
  | { ok: false; result: DriveWriteResult };

async function getGoogleDocument(docId: string, accessToken: string): Promise<GetDocumentResult> {
  try {
    const response = await fetch(`${DOCS_API_BASE}/${docId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      return { ok: false, result: response.status === 403 ? "forbidden" : "error" };
    }
    return { ok: true, document: await response.json() };
  } catch {
    return { ok: false, result: "error" };
  }
}

const getParagraphText = (paragraph: DocsParagraph): string =>
  paragraph.elements.map((element) => element.textRun?.content ?? "").join("");

/**
 * Finds the table to update: the one right after a "Professional skills"
 * heading, or - failing that - the last table in the document, which is
 * where this CV template's skills table normally lives.
 */
const findTargetTable = (content: DocsStructuralElement[]): DocsStructuralElement | undefined => {
  let headingEndIndex: number | undefined;
  const tables: DocsStructuralElement[] = [];

  content.forEach((element) => {
    if (element.paragraph) {
      const text = normalizeString(getParagraphText(element.paragraph));
      if (text.includes("professionalskills")) {
        headingEndIndex = element.endIndex;
      }
    }
    if (element.table) {
      tables.push(element);
    }
  });

  if (headingEndIndex !== undefined) {
    const tableAfterHeading = tables.find((table) => table.startIndex >= headingEndIndex!);
    if (tableAfterHeading) {
      return tableAfterHeading;
    }
  }

  return tables.at(-1);
};

/** After resizing the table, finds whichever table sits closest to where it started (its own startIndex doesn't move, this just re-locates it after a re-fetch). */
const findTableNear = (
  content: DocsStructuralElement[],
  nearIndex: number,
): DocsStructuralElement | undefined => {
  const tables = content.filter((element) => element.table);
  if (tables.length === 0) return undefined;

  return tables.reduce((closest, table) =>
    Math.abs(table.startIndex - nearIndex) < Math.abs(closest.startIndex - nearIndex)
      ? table
      : closest,
  );
};

const FONT_SIZE_PT = 10;

// The existing table's own top row(s) are assumed to be a header (e.g.
// "Technology | Experience | Last used") that the app doesn't generate and
// must never overwrite - only the data rows below it are touched.
const HEADER_ROW_COUNT = 1;

// Mirrors Table.tsx's own cell styling (bold red section name, bold dark
// technology names, plain dark years/last-used) so the doc matches what's
// shown - and what "Copy table" already pastes - instead of plain text.
const SECTION_NAME_STYLE = { bold: true, color: "#c63031" };
const TECHNOLOGY_NAME_STYLE = { bold: true, color: "#353535" };
const PLAIN_CELL_STYLE = { bold: false, color: "#353535" };

const hexToRgbColor = (hex: string) => {
  const value = hex.replace("#", "");
  return {
    color: {
      rgbColor: {
        red: parseInt(value.slice(0, 2), 16) / 255,
        green: parseInt(value.slice(2, 4), 16) / 255,
        blue: parseInt(value.slice(4, 6), 16) / 255,
      },
    },
  };
};

const buildTextStyleRequest = (
  startIndex: number,
  endIndex: number,
  style: { bold: boolean; color: string },
) => ({
  updateTextStyle: {
    range: { startIndex, endIndex },
    textStyle: {
      bold: style.bold,
      foregroundColor: hexToRgbColor(style.color),
      fontSize: { magnitude: FONT_SIZE_PT, unit: "PT" },
    },
    fields: "bold,foregroundColor,fontSize",
  },
});

/**
 * Grows or shrinks the table to fit the needed number of data rows, without
 * touching the header row(s) or deleting the table itself - row/column
 * borders, shading, etc. all stay exactly as they already are. A newly
 * inserted row copies the style of the row it's inserted below from, per
 * the Docs API's own behavior.
 */
const buildRowCountRequests = (
  tableStartIndex: number,
  currentRowCount: number,
  neededDataRowCount: number,
): object[] => {
  const currentDataRowCount = Math.max(currentRowCount - HEADER_ROW_COUNT, 0);
  const requests: object[] = [];
  const cellLocation = (rowIndex: number) => ({
    tableCellLocation: {
      tableStartLocation: { index: tableStartIndex },
      rowIndex,
      columnIndex: 0,
    },
  });

  if (neededDataRowCount > currentDataRowCount) {
    let lastRowIndex = currentRowCount - 1;
    for (let i = 0; i < neededDataRowCount - currentDataRowCount; i++) {
      requests.push({ insertTableRow: { ...cellLocation(lastRowIndex), insertBelow: true } });
      lastRowIndex += 1;
    }
  } else if (neededDataRowCount < currentDataRowCount) {
    let lastRowIndex = currentRowCount - 1;
    for (let i = 0; i < currentDataRowCount - neededDataRowCount; i++) {
      requests.push({ deleteTableRow: cellLocation(lastRowIndex) });
      lastRowIndex -= 1;
    }
  }

  return requests;
};

/**
 * Clears and refills each data row's cells (skipping the header row),
 * applying the matching text style per column.
 */
const buildCellUpdateRequests = (table: DocsTable, rowTexts: string[][]): object[] => {
  const requests: object[] = [];

  // Reverse document order (last row/column first) so each delete/insert
  // doesn't shift the index of a cell that hasn't been processed yet.
  for (let rowIndex = table.tableRows.length - 1; rowIndex >= HEADER_ROW_COUNT; rowIndex--) {
    const dataRowIndex = rowIndex - HEADER_ROW_COUNT;
    const cells = table.tableRows[rowIndex].tableCells;

    for (let colIndex = cells.length - 1; colIndex >= 0; colIndex--) {
      const cell = cells[colIndex];
      const startIndex = cell.content[0]?.startIndex;
      if (startIndex === undefined) continue;

      // A cell always keeps at least one paragraph mark - everything before
      // that is existing text we need to clear before writing the new value.
      const existingContentEnd = cell.endIndex - 1;
      if (existingContentEnd > startIndex) {
        requests.push({
          deleteContentRange: { range: { startIndex, endIndex: existingContentEnd } },
        });
      }

      const text = rowTexts[dataRowIndex]?.[colIndex];
      if (!text) continue;

      requests.push({ insertText: { location: { index: startIndex }, text } });

      const style =
        colIndex === 0
          ? SECTION_NAME_STYLE
          : colIndex === 1
            ? TECHNOLOGY_NAME_STYLE
            : PLAIN_CELL_STYLE;
      requests.push(buildTextStyleRequest(startIndex, startIndex + text.length, style));
    }
  }

  return requests;
};

export type TableUpdateResult = DriveWriteResult | "not-found";

/**
 * Updates the professional-skills table already in a native Google Doc to
 * match the one currently shown in the app (section, technologies, years,
 * last used), styled the same way (bold section/technology names, 10pt) -
 * without touching the table's header row or its existing borders/shading.
 */
export async function updateTechnologiesTableInGoogleDoc(
  docId: string,
  accessToken: string,
  table: ITechnologiesTableData,
): Promise<TableUpdateResult> {
  const sections = Object.entries(table);
  if (sections.length === 0) {
    return "not-found";
  }

  const initialDoc = await getGoogleDocument(docId, accessToken);
  if (!initialDoc.ok) return initialDoc.result;

  const targetTable = findTargetTable(initialDoc.document.body.content);
  if (!targetTable?.table) return "not-found";

  const rowCountRequests = buildRowCountRequests(
    targetTable.startIndex,
    targetTable.table.tableRows.length,
    sections.length,
  );

  if (rowCountRequests.length > 0) {
    const resizeResult = await batchUpdate(docId, accessToken, rowCountRequests);
    if (resizeResult !== "ok") return resizeResult;
  }

  const resizedDoc = await getGoogleDocument(docId, accessToken);
  if (!resizedDoc.ok) return resizedDoc.result;

  const resizedTable = findTableNear(resizedDoc.document.body.content, targetTable.startIndex);
  if (!resizedTable?.table) return "error";

  const rowTexts = sections.map(([sectionName, technologies]) => [
    capitalize(sectionName),
    technologies.map((technology) => technology.name).join("\n"),
    technologies.map((technology) => String(convertMonthsToYears(technology.range))).join("\n"),
    technologies.map((technology) => technology.lastUsed).join("\n"),
  ]);

  return batchUpdate(docId, accessToken, buildCellUpdateRequests(resizedTable.table, rowTexts));
}
