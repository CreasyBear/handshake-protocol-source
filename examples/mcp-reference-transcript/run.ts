import { mkdir, writeFile } from "node:fs/promises";
import {
  buildMcpX402ReferenceTranscript,
  buildMcpX402ReferenceTranscriptMarkdown,
} from "../../src/mcp/reference-transcript";

const outputDir = new URL("./output/", import.meta.url);
const outputJsonPath = new URL("./output/latest.json", import.meta.url);
const outputMarkdownPath = new URL("./output/latest.md", import.meta.url);

const pack = await buildMcpX402ReferenceTranscript();
const markdown = await buildMcpX402ReferenceTranscriptMarkdown();

await mkdir(outputDir, { recursive: true });
await writeFile(outputJsonPath, `${JSON.stringify(pack, null, 2)}\n`);
await writeFile(outputMarkdownPath, markdown);

console.log(markdown);
