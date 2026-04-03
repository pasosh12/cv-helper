const { google } = require("googleapis");
const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Initialize Netlify Blobs store (works automatically in Netlify Functions)
  const store = getStore("tokens");

  console.log("[google-token] Request:", event.httpMethod);

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

      await store.setJSON(uid, {
        refreshToken,
        updatedAt: new Date().toISOString(),
      });
      console.log("[google-token] Stored token for UID:", uid);

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

      const stored = await store.getJSON(uid, { type: "json" });
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
