import { useStore } from "@/hooks";
import { calculateDateRange } from "@/modules/utils/calculateDateRange";
import { fetchDocument } from "@/services/google-drive";
import mammoth from "mammoth";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { findProjectsData, findSelfInfo } from "../DocumentInput/utils";
import { Button, Input, Modal, Switch } from "antd";
import { Text } from "@/ui-kit/Typography";
import { Block } from "@/pages/MainPage/styles.ts";

const POLLING_INTERVAL = 5000;

const hashContent = (content: string): string => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash.toString(16);
};

export const LinkImport = observer(() => {
  const {
    projects: { clearStore, addProject, addSelfInfo, setFileName },
    auth,
  } = useStore();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const lastContentHash = useRef<string | null>(null);
  const docIdRef = useRef<string | null>(null);

  const extractGoogleDocId = (url: string): string | null => {
    const patterns = [
      /\/document\/d\/([a-zA-Z0-9-_]+)/,
      /\/document\/edit\?id=([a-zA-Z0-9-_]+)/,
      /\/document\/d\/e\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const processHtmlContent = useCallback(
    async (html: string, isAutoUpdate = false) => {
      const currentHash = hashContent(html);

      // Skip if content hasn't changed (only for auto-updates)
      if (isAutoUpdate && lastContentHash.current === currentHash) {
        return false;
      }

      lastContentHash.current = currentHash;
      // Проверка на кириллицу (как в оригинальном DocumentInput)
      if (/[\u0400-\u04FF]/.test(html)) {
        const cleanText = html.replace(/<\/?[^>]+(>|$)/g, " ");
        const cyrillicMatches = Array.from(
          cleanText.matchAll(/(.{0,40})([\u0400-\u04FF]+)(.{0,40})/g),
        );
        const totalOccurrences = cyrillicMatches.length;
        const contexts = cyrillicMatches.slice(0, 10).map((m, i) => (
          <li key={i} style={{ marginBottom: "8px", wordBreak: "break-word" }}>
            ...{m[1]}
            <span
              style={{
                backgroundColor: "#ffccc7",
                color: "#cf1322",
                padding: "0 4px",
                borderRadius: "2px",
                fontWeight: "bold",
              }}
            >
              {m[2]}
            </span>
            {m[3]}...
          </li>
        ));

        const hasMore = totalOccurrences > 10;

        Modal.error({
          title: "Cyrillic characters detected!",
          width: 650,
          content: (
            <div style={{ marginTop: "16px" }}>
              <p>
                Please remove all Cyrillic characters from the document and upload it again to
                continue.
              </p>
              <p style={{ marginTop: "16px", marginBottom: "8px" }}>
                <strong>
                  Found {totalOccurrences} occurrences{hasMore ? " (showing first 10)" : ""}:
                </strong>
              </p>
              <ul
                style={{
                  background: "#f5f5f5",
                  padding: "12px 12px 12px 32px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {contexts}
              </ul>
            </div>
          ),
          okText: "OK",
        });
        return;
      }

      const projects = findProjectsData(html);
      const selfInfo = findSelfInfo(html);

      clearStore();
      addSelfInfo(selfInfo);
      projects.forEach((item) => {
        addProject({
          id: 0,
          firstDate: item.dates[0],
          lastDate: item.dates[1],
          dateRange: calculateDateRange(item.dates[0], item.dates[1]),
          technologies: item.technologies,
          name: item.name,
          responsibilities: item.responsibilities,
          description: item.description,
        });
      });

      return true;
    },
    [addProject, addSelfInfo, clearStore],
  );

  const handleUrlImport = async () => {
    if (!url.trim()) return;

    const docId = extractGoogleDocId(url);
    if (!docId) {
      Modal.error({
        title: "Invalid URL",
        content: "Could not extract Google Docs document ID from the URL.",
      });
      return;
    }

    docIdRef.current = docId;
    setAutoSync(false);

    setLoading(true);
    try {
      // Get token automatically (from memory or silent refresh)
      const accessToken = await auth.getGoogleAccessToken();

      const { arrayBuffer, fileName } = await fetchDocument(docId, accessToken, () => {
        auth.clearGoogleToken();
      });
      const result = await mammoth.convertToHtml({ arrayBuffer });

      await processHtmlContent(result.value);
      setFileName(fileName || `Google Doc (${docId.slice(0, 8)}...)`);
    } catch (error) {
      Modal.error({
        title: "Import failed",
        content: (
          <div>
            <p>Failed to import from Google Docs.</p>
            {!auth.googleAccessToken && (
              <p>Please sign in with Google to access private documents.</p>
            )}
            {auth.googleAccessToken && (
              <p>Make sure the document is shared with your Google account ({auth.userEmail}).</p>
            )}
            <p style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync polling effect
  useEffect(() => {
    if (!autoSync || !docIdRef.current) {
      return;
    }

    const docId = docIdRef.current;

    const syncDocument = async () => {
      try {
        // Get token automatically (from memory or silent refresh)
        const accessToken = await auth.getGoogleAccessToken();

        const { arrayBuffer } = await fetchDocument(docId, accessToken, () => {
          auth.clearGoogleToken();
        });
        const result = await mammoth.convertToHtml({ arrayBuffer });
        await processHtmlContent(result.value, true);
        setLastSync(new Date());
      } catch (error) {
        // Silent fail on auto-sync errors
      }
    };

    syncDocument();

    const intervalId = setInterval(syncDocument, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [autoSync, auth, processHtmlContent]);

  return (
    <Block gap={10} align="center" wrap="wrap">
      <Input
        placeholder="https://docs.google.com/document/d/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: 360 }}
        onPressEnter={handleUrlImport}
      />
      <Button onClick={handleUrlImport} loading={loading} type="primary">
        Import
      </Button>
      {docIdRef.current && (
        <div>
          <Switch
            checked={autoSync}
            onChange={setAutoSync}
            checkedChildren="Auto"
            unCheckedChildren="Manual"
          />
          {lastSync && <Text> Updated: {lastSync.toLocaleTimeString()}</Text>}
        </div>
      )}
    </Block>
  );
});
