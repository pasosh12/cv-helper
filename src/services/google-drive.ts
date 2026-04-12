const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3/files";

export interface DocumentResult {
  arrayBuffer: ArrayBuffer;
  fileName: string | null;
}

export async function getFileMetadata(
  docId: string,
  accessToken: string,
): Promise<{ name: string } | null> {
  try {
    const response = await fetch(`${DRIVE_API_BASE}/${docId}?fields=name&supportsAllDrives=true`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Silent fail
  }
  return null;
}

export async function exportGoogleDoc(docId: string, accessToken: string): Promise<Response> {
  return fetch(
    `${DRIVE_API_BASE}/${docId}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function downloadFile(docId: string, accessToken: string): Promise<Response> {
  return fetch(`${DRIVE_API_BASE}/${docId}?alt=media&supportsAllDrives=true`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function extractFileNameFromHeaders(response: Response): string | null {
  const disposition = response.headers.get("content-disposition");
  if (disposition) {
    const match = disposition.match(/filename[^;=]*=["']?([^"';\s]+)["']?/i);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

export async function fetchDocument(
  docId: string,
  accessToken: string | null,
  onAuthError?: () => void,
): Promise<DocumentResult> {
  if (!accessToken) {
    throw new Error("Please sign in with Google to import documents.");
  }

  // Try export for native Google Docs
  const exportResponse = await exportGoogleDoc(docId, accessToken);

  if (exportResponse.ok) {
    const arrayBuffer = await exportResponse.arrayBuffer();
    const metadata = await getFileMetadata(docId, accessToken);
    return { arrayBuffer, fileName: metadata?.name ?? null };
  }

  if (exportResponse.status === 401) {
    onAuthError?.();
    throw new Error("Google session expired (401). Please sign in again.");
  }

  if (exportResponse.status === 403) {
    const errorText = await exportResponse.text();

    // Check if it's a non-exportable file (uploaded .docx)
    if (
      errorText.includes("fileNotExportable") ||
      errorText.includes("Export only supports Docs")
    ) {
      // Get filename from metadata first
      const metadata = await getFileMetadata(docId, accessToken);
      const fileName = metadata?.name ?? null;

      const downloadResponse = await downloadFile(docId, accessToken);

      if (downloadResponse.ok) {
        const arrayBuffer = await downloadResponse.arrayBuffer();
        // Fallback to Content-Disposition if metadata didn't work
        const fallbackName = fileName ?? extractFileNameFromHeaders(downloadResponse);
        return { arrayBuffer, fileName: fallbackName };
      }

      if (downloadResponse.status === 401 || downloadResponse.status === 403) {
        onAuthError?.();
      }

      throw new Error(`Download failed with status ${downloadResponse.status}`);
    }

    // Token expired or no permission
    onAuthError?.();
    throw new Error(
      `Access denied (403). ${errorText.includes("insufficientPermissions") ? "Google Drive permission missing." : "Your session may have expired."} Please sign in again.`,
    );
  }

  throw new Error(`Google Drive API failed (export: ${exportResponse.status}).`);
}
