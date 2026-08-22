import { spawn } from "node:child_process";

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
