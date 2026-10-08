import { capitalize } from "@/modules/utils/capitalize";
import { convertMonthsToYears } from "@/modules/utils/convertMonthsToYears";
import { normalizeString } from "@/modules/utils/normalizeString";
import { ISummaryField, ITechnologiesTableData } from "@/types/storeTypes";
import { DriveWriteResult } from "./google-drive";

const DOCS_API_BASE = "https://docs.googleapis.com/v1/documents";

// Narrow slice of the Docs API's document JSON shape - just enough to find
// headings/tables and the insertion point of each table cell.
interface DocsTextRun {
  content: string;
  textStyle?: Record<string, unknown>;
}
interface DocsParagraphElement {
  textRun?: DocsTextRun;
}
interface DocsParagraph {
  elements: DocsParagraphElement[];
  paragraphStyle?: Record<string, unknown>;
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
 * Many CV templates lay the whole page out as a table (e.g. a narrow left
 * column + wide right column), so headings/paragraphs the app cares about
 * often live inside table cells rather than directly in the document body.
 * Flattens content into document order, descending into every table cell
 * (and any tables nested inside those), so every search below sees them.
 */
const flattenContent = (content: DocsStructuralElement[]): DocsStructuralElement[] => {
  const flat: DocsStructuralElement[] = [];

  content.forEach((element) => {
    flat.push(element);

    if (element.table) {
      element.table.tableRows.forEach((row) => {
        row.tableCells.forEach((cell) => {
          flat.push(...flattenContent(cell.content));
        });
      });
    }
  });

  return flat;
};

/**
 * CVs often reuse the same category labels (e.g. "Backend", "Cloud") inside
 * each individual project's own tech breakdown, further down the document.
 * Scoping every heading search to before the "Projects" section keeps those
 * from being mistaken for the summary/skills section we actually want.
 */
const getProjectsBoundaryIndex = (flat: DocsStructuralElement[]): number | undefined =>
  flat.find(
    (element) =>
      element.paragraph &&
      normalizeString(getParagraphText(element.paragraph)).includes("projects"),
  )?.startIndex;

const beforeProjectsBoundary = (
  flat: DocsStructuralElement[],
): { scoped: DocsStructuralElement[]; boundaryIndex: number | undefined } => {
  const boundaryIndex = getProjectsBoundaryIndex(flat);
  return {
    scoped: boundaryIndex === undefined ? flat : flat.filter((el) => el.startIndex < boundaryIndex),
    boundaryIndex,
  };
};

/**
 * Finds the table to update: the one right after a "Professional skills"
 * heading, searching the whole document (unlike the per-category summary
 * search, this isn't scoped to before "Projects" - a consolidated skills
 * table commonly comes after the project history, and "professional
 * skills" is a distinctive enough phrase that it's not at real risk of
 * matching something inside an individual project's own description).
 * Deliberately does NOT fall back to "the last table in the document" when
 * no such heading exists - some CV templates present the skills section as
 * plain text (same as the summary) with no dedicated table at all, and the
 * only "table" in the document is the page's own layout table (e.g. a
 * 2-column resume template), which must never be mistaken for a skills
 * table to resize and refill.
 */
const findTargetTable = (content: DocsStructuralElement[]): DocsStructuralElement | undefined => {
  const flat = flattenContent(content);
  let headingEndIndex: number | undefined;
  const tables: DocsStructuralElement[] = [];

  flat.forEach((element) => {
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

  if (headingEndIndex === undefined) {
    return undefined;
  }

  return tables.find((table) => table.startIndex >= headingEndIndex!);
};

/** After resizing the table, finds whichever table sits closest to where it started (its own startIndex doesn't move, this just re-locates it after a re-fetch). */
const findTableNear = (
  content: DocsStructuralElement[],
  nearIndex: number,
): DocsStructuralElement | undefined => {
  const tables = flattenContent(content).filter((element) => element.table);
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

/**
 * The text style of the paragraph's main run - the one with the most actual
 * text. Not simply the first run: a paragraph can start with an empty or
 * whitespace-only run whose (empty) style would wipe the formatting when
 * applied with `fields: "*"`.
 */
const getMainRunStyle = (paragraph: DocsParagraph): Record<string, unknown> | undefined => {
  let best: { length: number; style: Record<string, unknown> } | undefined;

  paragraph.elements.forEach(({ textRun }) => {
    if (!textRun?.textStyle) return;
    const length = textRun.content.trim().length;
    if (!best || length > best.length) best = { length, style: textRun.textStyle };
  });

  return best?.style;
};

// Paragraph style properties that updateParagraphStyle accepts (headingId and
// tabStops are read-only and would make the request fail).
const COPYABLE_PARAGRAPH_STYLE_FIELDS = [
  "namedStyleType",
  "alignment",
  "lineSpacing",
  "direction",
  "spacingMode",
  "spaceAbove",
  "spaceBelow",
  "borderBetween",
  "borderTop",
  "borderBottom",
  "borderLeft",
  "borderRight",
  "indentFirstLine",
  "indentStart",
  "indentEnd",
  "keepLinesTogether",
  "keepWithNext",
  "avoidWidowAndOrphan",
  "shading",
];

/**
 * The paragraph's full style, not just its named style - CV templates
 * usually override the named style's color, spacing and indent directly on
 * the paragraph, and copying only `namedStyleType` brings back the
 * template's defaults (e.g. a red heading with large gaps and no indent).
 */
const getCopyableParagraphStyle = (
  paragraph: DocsParagraph,
  overrides: Record<string, unknown> = {},
): { paragraphStyle: Record<string, unknown>; fields: string } | undefined => {
  const style = { ...paragraph.paragraphStyle, ...overrides };
  const fields = COPYABLE_PARAGRAPH_STYLE_FIELDS.filter((field) => field in style);
  if (fields.length === 0) return undefined;

  return {
    paragraphStyle: Object.fromEntries(fields.map((field) => [field, style[field]])),
    fields: fields.join(","),
  };
};

// Every summary heading/list lines up with the candidate description above it.
const INDENT_FIELDS = ["indentStart", "indentEnd", "indentFirstLine"];

// Section headings are always bold and never italic, lists never either -
// whatever the paragraphs they copy look like.
const HEADING_TEXT_STYLE = { bold: true, italic: false };
const CONTENT_TEXT_STYLE = { bold: false, italic: false };

// Gap between a section heading and its list.
const HEADING_SPACE_BELOW = { magnitude: 3, unit: "PT" };

// Gap after each list - i.e. between a section's last line and the next heading.
const CONTENT_SPACE_BELOW = { magnitude: 10, unit: "PT" };

const pickParagraphStyle = (paragraph: DocsParagraph, fields: string[]): Record<string, unknown> =>
  Object.fromEntries(
    fields
      .filter((field) => paragraph.paragraphStyle?.[field] !== undefined)
      .map((field) => [field, paragraph.paragraphStyle![field]]),
  );

const getMagnitude = (dimension: unknown): number =>
  (dimension as { magnitude?: number } | undefined)?.magnitude ?? 0;

/** Whether the paragraph already has every property in `style` (dimensions compared by magnitude). */
const hasParagraphStyle = (paragraph: DocsParagraph, style: Record<string, unknown>): boolean =>
  Object.entries(style).every(
    ([field, value]) => getMagnitude(paragraph.paragraphStyle?.[field]) === getMagnitude(value),
  );

/** Whether every non-blank run has exactly these boolean text properties (unset counts as false). */
const hasTextStyle = (paragraph: DocsParagraph, style: Record<string, boolean>): boolean =>
  paragraph.elements.every(
    ({ textRun }) =>
      !textRun?.content.trim() ||
      Object.entries(style).every(
        ([field, value]) => Boolean(textRun.textStyle?.[field]) === value,
      ),
  );

const isHeadingStyle = (paragraph: DocsParagraph): boolean =>
  /^(HEADING_|TITLE|SUBTITLE)/.test(String(paragraph.paragraphStyle?.namedStyleType ?? ""));

/** Compares paragraph texts ignoring whitespace differences (trailing newline, soft line breaks, double spaces). */
const normalizeParagraphText = (text: string): string => text.replace(/\s+/g, " ").trim();

/**
 * The candidate description paragraph right above the summary - the nearest
 * non-empty body-text paragraph before the first summary heading.
 */
const findDescriptionParagraph = (
  flat: DocsStructuralElement[],
  firstHeadingIndex: number,
  allSectionNames: Set<string>,
): DocsParagraph | undefined =>
  flat
    .filter(
      (element) =>
        element.paragraph &&
        element.startIndex < firstHeadingIndex &&
        !isHeadingStyle(element.paragraph) &&
        normalizeString(getParagraphText(element.paragraph)) !== "" &&
        !allSectionNames.has(normalizeString(getParagraphText(element.paragraph))),
    )
    .at(-1)?.paragraph;

/** The content list (a table cell's or the body's) that directly holds the paragraph starting at `index`. */
const findContainer = (
  content: DocsStructuralElement[],
  index: number,
): DocsStructuralElement[] | undefined => {
  for (const element of content) {
    if (element.paragraph && element.startIndex === index) return content;

    for (const row of element.table?.tableRows ?? []) {
      for (const cell of row.tableCells) {
        const container = findContainer(cell.content, index);
        if (container) return container;
      }
    }
  }
  return undefined;
};

/** Paragraph + text style requests that make [startIndex, endIndex) look like `paragraph`. */
const buildCopyStyleRequests = (
  paragraph: DocsParagraph,
  startIndex: number,
  endIndex: number,
  overrides: Record<string, unknown> = {},
  textOverrides: Record<string, unknown> = {},
): object[] => {
  const requests: object[] = [];
  const paragraphStyle = getCopyableParagraphStyle(paragraph, overrides);
  const textStyle = { ...getMainRunStyle(paragraph), ...textOverrides };

  // Paragraph style first: changing the named style must not override the
  // explicit text style applied right after it.
  if (paragraphStyle) {
    requests.push({ updateParagraphStyle: { range: { startIndex, endIndex }, ...paragraphStyle } });
  }
  if (Object.keys(textStyle).length > 0) {
    requests.push({
      updateTextStyle: { range: { startIndex, endIndex }, textStyle, fields: "*" },
    });
  }
  return requests;
};

export interface SummarySectionOutcome {
  sectionName: string;
  outcome: "updated" | "inserted" | "removed";
}

export interface SummaryUpdateOutcome {
  result: TableUpdateResult;
  /** False when the doc already matched - nothing was sent. */
  rewritten: boolean;
  /** Sections whose list changed, that were added, or that were in the doc but aren't in the app anymore - in that order of appearance. Formatting-only fixes aren't listed. */
  sections: SummarySectionOutcome[];
}

/**
 * Rewrites the summary in a native Google Doc - the "Programming languages"
 * through "AI tools" section list - to match the one currently shown in the
 * app. Everything from the first summary heading to the last non-empty line
 * of its table cell (or up to "Projects", outside a table) is replaced, so
 * categories an older CV has but the app no longer does (e.g. "DevOps") go
 * away instead of lingering next to the new ones.
 *
 * Headings copy the existing summary heading's formatting; lists copy an
 * existing, properly formatted list or - if there's none - the candidate
 * description above the summary. Everything gets the description's
 * left/right indent, and each list a 10pt gap below it.
 */
export async function updateSummaryInGoogleDoc(
  docId: string,
  accessToken: string,
  summary: ISummaryField,
): Promise<SummaryUpdateOutcome> {
  const sections = Object.entries(summary)
    .filter(([, values]) => values.length > 0)
    .map(([heading, values]) => ({ heading, content: `${values.join(", ")}.` }));
  const notChanged = (result: TableUpdateResult): SummaryUpdateOutcome => ({
    result,
    rewritten: false,
    sections: [],
  });
  if (sections.length === 0) return notChanged("not-found");

  const doc = await getGoogleDocument(docId, accessToken);
  if (!doc.ok) return notChanged(doc.result);

  const body = doc.document.body.content;
  const { scoped: flat, boundaryIndex } = beforeProjectsBoundary(flattenContent(body));
  const sectionNames = new Set(sections.map(({ heading }) => normalizeString(heading)));
  const textOf = (element: DocsStructuralElement) => getParagraphText(element.paragraph!);

  const firstHeading = flat.find(
    (element) => element.paragraph && sectionNames.has(normalizeString(textOf(element))),
  );
  if (!firstHeading) return notChanged("not-found");

  // The block to rewrite: the heading and every paragraph after it in the
  // same cell, up to "Projects" - minus trailing empty lines, which stay.
  const container = findContainer(body, firstHeading.startIndex)!;
  const region: DocsStructuralElement[] = [];
  for (const element of container.slice(container.indexOf(firstHeading))) {
    if (
      !element.paragraph ||
      (boundaryIndex !== undefined && element.startIndex >= boundaryIndex)
    ) {
      break;
    }
    region.push(element);
  }
  const lines = region.filter((element) => normalizeParagraphText(textOf(element)) !== "");

  // What the block currently says, to report what changed. A heading is a
  // known section name or - for categories the app doesn't have anymore - a
  // heading-styled line that isn't a list (lists end with a period).
  const headingParagraph = firstHeading.paragraph!;
  const headingNamedStyle = headingParagraph.paragraphStyle?.namedStyleType;
  const isOldHeading = (element: DocsStructuralElement) => {
    const text = normalizeParagraphText(textOf(element));
    return (
      sectionNames.has(normalizeString(text)) ||
      (isHeadingStyle(element.paragraph!) && !text.endsWith("."))
    );
  };
  const oldSections = new Map<string, { heading: string; content: string[] }>();
  let current: { heading: string; content: string[] } | undefined;
  lines.forEach((element) => {
    if (isOldHeading(element)) {
      current = { heading: normalizeParagraphText(textOf(element)), content: [] };
      oldSections.set(normalizeString(current.heading), current);
    } else {
      current?.content.push(normalizeParagraphText(textOf(element)));
    }
  });

  // A list styled like its heading (e.g. added under a lone heading) can't be
  // used as the list reference.
  const oldLists = lines.filter((element) => !isOldHeading(element));
  const listReference = oldLists.find(
    (element) => element.paragraph!.paragraphStyle?.namedStyleType !== headingNamedStyle,
  )?.paragraph;
  const description = findDescriptionParagraph(flat, firstHeading.startIndex, sectionNames);
  const contentParagraph = listReference ?? description;
  if (!contentParagraph) return notChanged("not-found");

  const indent = description ? pickParagraphStyle(description, INDENT_FIELDS) : {};
  const contentOverrides = {
    // The description's own spacing is for a block of prose - keep lists as
    // tight as the headings, apart from the gap after each one.
    ...(listReference ? {} : pickParagraphStyle(headingParagraph, ["spaceAbove", "lineSpacing"])),
    ...indent,
    spaceBelow: CONTENT_SPACE_BELOW,
  };

  const sectionOutcomes: SummarySectionOutcome[] = [
    ...sections.flatMap(({ heading, content }): SummarySectionOutcome[] => {
      const old = oldSections.get(normalizeString(heading));
      if (!old) return [{ sectionName: heading, outcome: "inserted" }];
      return old.content.join(" ") === content
        ? []
        : [{ sectionName: heading, outcome: "updated" }];
    }),
    ...[...oldSections.entries()]
      .filter(([name]) => !sectionNames.has(name))
      .map(
        ([, { heading }]): SummarySectionOutcome => ({ sectionName: heading, outcome: "removed" }),
      ),
  ];

  // Already exactly right - same lines in the same order, already formatted.
  const expectedLines = sections.flatMap(({ heading, content }) => [heading, content]);
  const isUpToDate =
    lines.length === expectedLines.length &&
    lines.every((element, i) => {
      const paragraph = element.paragraph!;
      const isHeading = i % 2 === 0;
      return (
        normalizeParagraphText(textOf(element)) === expectedLines[i] &&
        hasParagraphStyle(paragraph, indent) &&
        hasTextStyle(paragraph, isHeading ? HEADING_TEXT_STYLE : CONTENT_TEXT_STYLE) &&
        (isHeading
          ? hasParagraphStyle(paragraph, { spaceBelow: HEADING_SPACE_BELOW })
          : paragraph.paragraphStyle?.namedStyleType !== headingNamedStyle &&
            hasParagraphStyle(paragraph, { spaceBelow: CONTENT_SPACE_BELOW }))
      );
    });
  if (isUpToDate) return notChanged("ok");

  // Delete up to (not including) the last line's newline, which then closes
  // the last inserted list - so the cell's own final paragraph is never removed.
  const startIndex = firstHeading.startIndex;
  const endIndex = lines.at(-1)!.endIndex - 1;
  const requests: object[] = [];
  if (endIndex > startIndex) {
    requests.push({ deleteContentRange: { range: { startIndex, endIndex } } });
  }
  requests.push({
    insertText: { location: { index: startIndex }, text: expectedLines.join("\n") },
  });

  let offset = startIndex;
  expectedLines.forEach((line, i) => {
    const isHeading = i % 2 === 0;
    requests.push(
      ...(isHeading
        ? buildCopyStyleRequests(
            headingParagraph,
            offset,
            offset + line.length,
            { ...indent, spaceBelow: HEADING_SPACE_BELOW },
            HEADING_TEXT_STYLE,
          )
        : buildCopyStyleRequests(
            contentParagraph,
            offset,
            offset + line.length,
            contentOverrides,
            CONTENT_TEXT_STYLE,
          )),
    );
    offset += line.length + 1;
  });

  const result = await batchUpdate(docId, accessToken, requests);
  return { result, rewritten: true, sections: sectionOutcomes };
}
