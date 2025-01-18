import { defineConfig } from "vite";
import path from "path";
import Userscript from "vite-userscript-plugin";

import { name, version } from "./package.json";

import {
  match,
  namespace,
  description,
  author,
  downloadURL,
  updateURL,
} from "./src/config/userScriptConfig.json";

export default defineConfig((config) => {
  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    plugins: [
      Userscript({
        entry: "./src/index.ts",
        header: {
          name,
          version,
          match,
          namespace,
          description,
          author,
          downloadURL,
          updateURL,
        },
        esbuildTransformOptions: {
          minify: false,
        },
      }),
    ],
  };
});
