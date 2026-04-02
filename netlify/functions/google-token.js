const { google } = require("googleapis");

// Simple in-memory storage for demo (replace with Firestore in production)
// In production, use Firestore: const admin = require('firebase-admin');
const tokenStore = new Map();

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

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
    const { action, firebaseToken } = JSON.parse(event.body);

    // Verify Firebase token and get UID
    // In production: verify with firebase-admin
    // For now, we'll use a simple approach with the client's firebaseToken

    if (action === "store") {
      const { refreshToken, uid } = JSON.parse(event.body);

      if (!refreshToken || !uid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing refreshToken or uid" }),
        };
      }

      // Store in memory (replace with Firestore in production)
      tokenStore.set(uid, {
        refreshToken,
        updatedAt: new Date().toISOString(),
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (action === "getAccessToken") {
      const { uid } = JSON.parse(event.body);

      if (!uid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing uid" }),
        };
      }

      const stored = tokenStore.get(uid);
      if (!stored) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "No refresh token found" }),
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
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
