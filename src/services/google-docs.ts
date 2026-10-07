import { DriveWriteResult } from "./google-drive";

const DOCS_API_BASE = "https://docs.googleapis.com/v1/documents";

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

  try {
    const response = await fetch(`${DOCS_API_BASE}/${docId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            replaceAllText: {
              containsText: { text: oldText, matchCase: false },
              replaceText: newText,
            },
          },
        ],
      }),
    });
    if (response.ok) return "ok";
    return response.status === 403 ? "forbidden" : "error";
  } catch {
    return "error";
  }
}
