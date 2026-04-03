const { google } = require("googleapis");

// Netlify Function to exchange authorization code for refresh token
exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
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
    const { code } = JSON.parse(event.body);

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Authorization code is required" }),
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "postmessage",
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "No refresh token received. User may have already granted access before.",
        }),
      };
    }

    // Return tokens to client
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        success: true,
      }),
    };
  } catch (error) {
    console.error("Error exchanging code:", error);
    console.error("Error details:", error.response?.data || error.message);
    console.error("Client ID present:", !!process.env.GOOGLE_CLIENT_ID);
    console.error("Client Secret present:", !!process.env.GOOGLE_CLIENT_SECRET);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to exchange code",
        details: error.response?.data?.error_description || error.message,
      }),
    };
  }
};
