export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        fetch: "readonly",
        URL: "readonly",
        Blob: "readonly",
        FileReader: "readonly",
        Image: "readonly",
        HTMLElement: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        CustomEvent: "readonly",
        ResizeObserver: "readonly",
        MutationObserver: "readonly",
        // App-specific globals
        app: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off", // Allow console for now, we'll clean up manually
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
      "scripts/**",
      "node_modules/**",
      ".git/**",
    ],
  },
];
