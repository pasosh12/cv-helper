import { existsSync } from "node:fs";

if (!existsSync(".netlify/state.json")) {
  console.error(`
✖ This project isn't linked to a Netlify site yet.

Netlify Blobs (used by netlify/functions/google-token.js) only receives
real credentials locally once the project is linked to the actual site.
Without linking, requests fail with a 401 / "environment has not been
configured" error even though the dev server itself starts fine.

Run once:

  npx netlify link

then re-run "npm start".
`);
  process.exit(1);
}
