import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";

// Must match [dev] in netlify.toml. 8888 is the origin registered in the
// Google OAuth client; 5173 is the internal Vite port netlify dev proxies to.
const APP_PORT = 8888;
const VITE_PORT = 5173;

if (!existsSync(".netlify/state.json")) {
  console.error(`
✖ This project isn't linked to a Netlify site yet.

Netlify Blobs (used by netlify/functions/google-token.js) only receives
real credentials locally once the project is linked to the actual site.
Without linking, requests fail with a 401 / "environment has not been
configured" error even though the dev server itself starts fine.

Run once:

  npx netlify link

then re-run "npm run dev".
`);
  process.exit(1);
}

const isPortFree = (port) =>
  new Promise((resolve) => {
    const server = createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port);
  });

const busy = [];
for (const port of [APP_PORT, VITE_PORT]) {
  if (!(await isPortFree(port))) busy.push(port);
}

if (busy.length) {
  console.error(`
✖ Port ${busy.join(" and ")} ${busy.length > 1 ? "are" : "is"} already in use (probably another "npm run dev").

The app must run on http://localhost:${APP_PORT} - it's the only local origin
allowed by the Google OAuth client, so any other port breaks sign-in with
"Error 400: origin_mismatch". Stop the other process and re-run "npm run dev".
`);
  process.exit(1);
}

console.log(
  `\n▶ Starting app on http://localhost:${APP_PORT} (open this URL, not :${VITE_PORT})\n`,
);

// netlify-cli occasionally crashes on Windows with an EBUSY error while
// copying function bundle files (a known upstream file-watcher race
// condition), leaving the whole dev server dead until someone notices and
// restarts it by hand. This wrapper restarts it automatically, but gives up
// after too many crashes in a short window so a real, persistent problem
// doesn't loop forever silently.
const MAX_RESTARTS = 5;
const RESTART_WINDOW_MS = 60_000;
const RESTART_DELAY_MS = 1000;

const restartTimestamps = [];
let child = null;
let stopping = false;

const start = () => {
  child = spawn("netlify", ["dev"], { stdio: "inherit", shell: true });

  child.on("exit", (code, signal) => {
    if (stopping || signal) return;
    if (code === 0) return;

    const now = Date.now();
    restartTimestamps.push(now);
    while (restartTimestamps.length && now - restartTimestamps[0] > RESTART_WINDOW_MS) {
      restartTimestamps.shift();
    }

    if (restartTimestamps.length > MAX_RESTARTS) {
      console.error(
        `\n✖ netlify dev crashed ${MAX_RESTARTS} times in the last minute - giving up.\n` +
          "This looks like a persistent issue rather than the usual transient Windows EBUSY glitch.\n",
      );
      process.exit(code ?? 1);
    }

    console.warn(`\n⬥ netlify dev exited unexpectedly (code ${code}). Restarting in 1s...\n`);
    setTimeout(start, RESTART_DELAY_MS);
  });
};

const stop = () => {
  stopping = true;
  child?.kill();
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

start();
