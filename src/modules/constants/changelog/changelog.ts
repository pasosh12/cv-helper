export type ChangelogEntry = {
  date: string;
  items: string[];
};

// Newest entry first. Bump CHANGELOG_VERSION whenever a new entry is added
// so the "What's new" modal shows again for everyone.
export const CHANGELOG_VERSION = "2026-10-08";

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-10-08",
    items: [
      'Added an "Update Summary" button - rewrites the summary in the imported Google Doc to match the one shown in the app: outdated categories are removed, and headings and lists are formatted consistently and aligned with the candidate description. A popup lists which sections were updated, added or removed.',
      'Added an "Update table" button next to "Copy table" - pushes the professional skills table (Default or Hays view) into the imported Google Doc, keeping the document\'s own table styling.',
      "The CV's name and the file name are now checked against the HRM employee list - shown in green when they match, in red with a recommended spelling when they don't.",
      'Added an "Apply recommended" button - renames the Google Drive file and fixes the name inside the Google Doc in one click.',
      'The candidate\'s age is now shown next to "Source:", along with the recommended maximum years of experience.',
      'Added a "Birthdays" button - a searchable list of everyone\'s date of birth and age.',
      "Google sign-in now also asks for permission to edit your Drive files and Docs, which the new buttons need. If one of them reports a missing permission, sign out and sign back in.",
    ],
  },
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
