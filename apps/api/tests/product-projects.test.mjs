import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProductProjects, parseProductManifest, stageProductAsset } from "../scripts/import-product-projects.mjs";

const root = fileURLToPath(new URL("../content/product-projects-2026/", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));

test("product package uses confirmed technologies, supplied months, and portable images", async () => {
  const projects = await loadProductProjects(root);
  assert.equal(projects.length, 3);
  const [milc, smartmatch] = projects.map(project => project.data);
  assert.match(milc.solution, /Project date: January 2026/);
  assert.match(smartmatch.solution, /Project date: April 2026/);
  assert.ok(milc.stack.includes("Electron"));
  for (const project of [milc, smartmatch]) {
    assert.ok(project.stack.includes("Node.js"));
    assert.ok(project.stack.includes("Express"));
    assert.match(project.coverImageUrl, /^\/uploads\/projects\//);
    assert.ok(project.links.some(link => link.label === "Live product"));
    assert.equal(project.status, "published");
    assert.equal(project.createdAt, undefined);
  }
  assert.ok(smartmatch.sortOrder < milc.sortOrder);
  assert.doesNotMatch(smartmatch.outcome, /99\.8|300|sub-second/);
  for (const project of projects) {
    const bytes = await readFile(project.source);
    assert.equal(bytes.subarray(0, 4).toString(), "RIFF");
    assert.equal(bytes.subarray(8, 12).toString(), "WEBP");
  }
});

test("Planpresso preserves the deployed beta boundaries and verified stack", async () => {
  const project = (await loadProductProjects(root)).find(item => item.data.slug === "planpresso-ai-prd-planner").data;
  assert.match(project.solution, /Project date: October 2026/);
  for (const technology of ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Better Auth", "OpenAI Responses API"])
    assert.ok(project.stack.includes(technology));
  assert.doesNotMatch(project.stack.join(" "), /Supabase|Express/);
  assert.match(project.solution, /does not silently repeat a paid request/);
  assert.match(project.outcome, /Paid subscriptions and file processing remain disabled/);
  assert.match(project.outcome, /not certified as executed inside every target tool/);
  assert.match(project.coverImageUrl, /^\/uploads\/projects\/planpresso-ai-prd-planner\//);
  assert.equal(project.links.find(link => link.label === "Live product").url, "https://planpresso.doniputra.com/");
  assert.equal(project.featured, true);
  assert.equal(project.status, "published");
  assert.ok(project.sortOrder < manifest.projects[1].sortOrder);
});

test("invalid paths, duplicate slugs, months, and unsafe links are rejected", () => {
  for (const mutate of [
    value => { value.projects[0].asset = "../other"; },
    value => { value.projects[0].solutionFile = "../../other.md"; },
    value => { value.projects[1].slug = value.projects[0].slug; },
    value => { value.projects[0].month = 13; },
    value => { value.projects[0].links[0].url = "javascript:alert(1)"; },
  ]) {
    const value = structuredClone(manifest);
    mutate(value);
    assert.throws(() => parseProductManifest(value));
  }
});

test("asset staging is idempotent and refuses to overwrite different bytes", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "portfolio-products-test-"));
  try {
    const source = path.join(directory, "source.webp");
    const destination = path.join(directory, "uploads", "cover.webp");
    await writeFile(source, "first-image");
    await stageProductAsset(source, destination);
    await stageProductAsset(source, destination);
    await writeFile(source, "replacement-image");
    await assert.rejects(stageProductAsset(source, destination), /Refusing to overwrite/);
    assert.equal(await readFile(destination, "utf8"), "first-image");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
