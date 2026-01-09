import globals from "globals";

export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        app: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "group", "groupEnd"] }],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      semi: ["error", "always"],
    },
  },
  {
    ignores: [
      "UE5LMSMaterials/**",
      "Icons/**",
      "scripts/*.py",
      "*.bat",
      "node_modules/**",
    ],
  },
];
