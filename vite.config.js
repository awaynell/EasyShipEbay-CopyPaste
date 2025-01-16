import { defineConfig } from "vite";
import path from "path";
import Userscript from "vite-userscript-plugin";

import { name, version } from "./package.json";

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
          match: [
            "https://www.ebay.com/itm/*",
            "https://lk.easyship.ru/*",
            "https://creations.mattel.com/*",
          ],
          namespace: "https://github.com/awaynell/EasyShipEbay-CopyPaste",
          description:
            "Объединение двух скриптов для разных сайтов и немножко еще",
          author: "Clovett",
        },
        esbuildTransformOptions: {
          minify: false,
        },
      }),
    ],
  };
});
