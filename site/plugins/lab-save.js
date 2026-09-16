/*
  Lets /lab save what was edited on the page back to disk.

  The dev server only (`apply: "serve"`), so a build knows nothing of it. It
  answers one request, POST /__lab/save with { path, content }, and it is
  deliberately narrow about what it will write:

  - only files that already exist, so a typo in a path cannot scatter new files
    around the repository; new mixins and cases are created in the editor;
  - only .scss under scss/, and .scss or .html under site/lab/cases;
  - nothing is deleted, and the path is resolved before it is checked, so
    `../` cannot climb out of either folder.

  A file written here reaches Vite's watcher like any other save, which is what
  reloads the lab with the new source.
*/
import { existsSync, promises as fs } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const WRITABLE = [
  { dir: resolve(REPO, "scss"), extensions: [".scss"] },
  { dir: resolve(REPO, "site/lab/cases"), extensions: [".scss", ".html"] },
];

const LIMIT = 1024 * 1024;

export default function labSave() {
  return {
    name: "lab-save",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__lab/save", (req, res) => {
        const reply = (status, body) => {
          if (res.writableEnded) return;
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };

        if (req.method !== "POST") {
          reply(405, { error: "Only POST is accepted" });
          return;
        }

        const chunks = [];
        let size = 0;
        req.on("data", (chunk) => {
          size += chunk.length;
          if (size > LIMIT) {
            reply(413, { error: "The file is larger than the lab will write" });
            req.destroy();
          } else {
            chunks.push(chunk);
          }
        });

        req.on("end", async () => {
          if (res.writableEnded) return;
          try {
            const { path, content } = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            if (typeof path !== "string" || typeof content !== "string") {
              reply(400, { error: "path and content have to be strings" });
              return;
            }
            const target = resolve(REPO, path);
            const allowed = WRITABLE.some(
              ({ dir, extensions }) =>
                target.startsWith(dir + sep) && extensions.includes(extname(target))
            );
            if (!allowed) {
              reply(403, { error: `${path} is outside what the lab may write` });
              return;
            }
            if (!existsSync(target)) {
              reply(404, { error: `${path} does not exist. Create new files in the editor.` });
              return;
            }
            await fs.writeFile(target, content, "utf8");
            reply(200, { saved: relative(REPO, target) });
          } catch (error) {
            reply(500, { error: error.message });
          }
        });
      });
    },
  };
}
