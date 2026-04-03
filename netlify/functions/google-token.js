const { google } = require("googleapis");
const { getStore } = require("@netlify/blobs");

// Fallback in-memory store for local development
const localTokenStore = new Map();

// Initialize store - uses Netlify Blobs in production, in-memory for local dev
const getTokenStore = () => {
  // Check if running in production Netlify environment
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_BLOBS_TOKEN) {
    return {
      type: "blobs",
      store: getStore({
        name: "tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_BLOBS_TOKEN,
      }),
      async set(key, value) {
        await this.store.set(key, value);
      },
      async get(key) {
        return await this.store.get(key);
      },
    };
  }

  // Local development fallback
  console.log("[google-token] Using in-memory store (local dev)");
  return {
    type: "memory",
    async set(key, value) {
      localTokenStore.set(key, value);
    },
    async get(key) {
      return localTokenStore.get(key);
    },
  };
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  const store = getTokenStore();
  console.log("[google-token] Request:", event.httpMethod, "Store type:", store.type);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    console.log("[google-token] Action:", body.action, "UID:", body.uid);

    if (body.action === "store") {
      const { refreshToken, uid } = body;

      if (!refreshToken || !uid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing refreshToken or uid" }),
        };
      }

      try {
        await store.set(
          uid,
          JSON.stringify({
            refreshToken,
            updatedAt: new Date().toISOString(),
          }),
        );
        console.log("[google-token] Successfully stored token for UID:", uid);
      } catch (storeError) {
        console.error("[google-token] Failed to store token:", storeError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "Failed to store token", details: storeError.message }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (body.action === "getAccessToken") {
      const { uid } = body;

      if (!uid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing uid" }),
        };
      }

      const data = await store.get(uid);
      const stored = data ? JSON.parse(data) : null;
      console.log("[google-token] Looking up token for UID:", uid, "Found:", !!stored);

      if (!stored) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "No refresh token found for user" }),
        };
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );

      oauth2Client.setCredentials({
        refresh_token: stored.refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log("[google-token] Access token refreshed successfully");

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          accessToken: credentials.access_token,
          expiresIn: credentials.expiry_date
            ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
            : 3600,
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid action" }),
    };
  } catch (error) {
    console.error("[google-token] Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error", details: error.message }),
    };
  }
};
