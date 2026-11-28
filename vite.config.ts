import { characterAssetPath } from "./src/characterAssetPath.ts";
import { defineConfig } from "vite";
import dataset from "./data/characters.json" with { type: "json" };
import recordingSources from "./public/pronunciation-sources.json" with { type: "json" };

// Keep the licensed source together, but serve only the characters in the open word.
const guides = new Map(Object.entries(dataset.characters).map(([character, guide]) => [
  characterAssetPath(character),
  JSON.stringify({ ...guide, notice: dataset.notice }),
]));

export default defineConfig({
  define: { __PRONUNCIATION_KEYS__: JSON.stringify(Object.keys(recordingSources)) },
  plugins: [{
    name: "writing-guides",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split("?")[0];
        const source = pathname?.startsWith(server.config.base)
          ? guides.get(pathname.slice(server.config.base.length)) : undefined;
        if (!source) return next();
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(source);
      });
    },
    generateBundle() {
      for (const [fileName, source] of guides)
        this.emitFile({ type: "asset", fileName, source });
    },
  }],
});
