export type ChangelogEntry = {
  date: string;
  items: string[];
};

// Newest entry first. Bump CHANGELOG_VERSION whenever a new entry is added
// so the "What's new" modal shows again for everyone.
export const CHANGELOG_VERSION = "2026-08-22-2";

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-08-22",
    items: [
      'Added a "Hays" view for the professional skills table - group technologies into broad categories (Frontend, Backend, AI tools, etc.) with one click next to "Copy table".',
      "Fixed an issue that could cause Google sign-in to fail with a server error.",
      "Fixed text and section layout so headings and columns resize smoothly instead of overlapping when the window is narrower or the page is zoomed.",
    ],
  },
  {
    date: "2026-04-12",
    items: [
      "Fixed session-expiration errors that could interrupt file export and download after being signed in for a while.",
      "Various UI fixes and polish.",
      "Updated the app icon.",
    ],
  },
];
