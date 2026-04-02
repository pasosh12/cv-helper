module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh", "prettier"],
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "prettier/prettier": ["error"],
    // "no-console": ["warn"],
  },
  overrides: [
    {
      files: ["netlify/functions/**/*.js"],
      env: { node: true },
      parser: null,
      plugins: ["prettier"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "prettier/prettier": ["error"],
      },
    },
  ],
};
