import assert from "node:assert/strict";
import { test } from "node:test";
import { projectCover } from "../lib/project-cover";

test("real photographs use accurate descriptions and source credits", () => {
  const inose = projectCover(
    "/uploads/projects/i-nose-c19-ml-model/editorial-2026-inose-device.webp",
    "i-Nose",
  );
  assert.equal(inose.credit?.label, "Photo: ITS News");
  assert.match(inose.alt, /real i-Nose/);
  assert.doesNotMatch(inose.caption!, /Conceptual/);

  const campus = projectCover(
    "https://api.example.com/uploads/projects/learning/editorial-2026-kawaijuku-campus.webp?v=2",
    "Kawaijuku",
  );
  assert.match(campus.credit!.label, /CC0/);
  assert.match(campus.caption!, /not the PoC/);
});

test("generated equipment imagery is disclosed and never credited as a real photo", () => {
  const cover = projectCover(
    "/uploads/projects/i-nose-c19-ml-model/editorial-2026-inose-equipment.webp",
    "i-Nose",
  );
  assert.match(cover.alt, /AI-generated reconstruction/);
  assert.match(cover.caption!, /not an archival photograph/);
  assert.doesNotMatch(cover.credit!.label, /^Photo:/);
  assert.equal(cover.width / cover.height, 16 / 9);
});

test("replacing a cover in admin does not keep the previous photo's credits", () => {
  const custom = projectCover("/uploads/projects/i-nose/new-cover.png", "i-Nose");
  assert.equal(custom.credit, undefined);
  assert.equal(custom.caption, undefined);
  assert.equal(
    projectCover("https://example.com/toString", "Custom").credit,
    undefined,
  );
});

test("Trajectory retains its conceptual cover presentation", () => {
  const drone = projectCover(
    "/uploads/projects/trajectory/editorial-2026-drone.webp",
    "Trajectory",
  );
  assert.equal(drone.caption, "Conceptual project illustration.");
  assert.equal(drone.width, 1440);
  assert.equal(drone.height, 810);
});

test("new product covers identify generated UI and link to the real products", () => {
  for (const [asset, url] of [
    ["milc", "https://milc.work/en"],
    ["smartmatch", "https://smartmatch.gloding.com/"],
  ]) {
    const cover = projectCover(`/uploads/projects/product/products-2026-${asset}.webp`, asset);
    assert.match(cover.caption!, /AI-generated product visualization/);
    assert.match(cover.caption!, /not an application screenshot/);
    assert.equal(cover.credit!.href, url);
    assert.equal(cover.width / cover.height, 16 / 9);
    assert.equal(projectCover(`/uploads/projects/product/custom-${asset}.png`, asset).caption, undefined);
  }
});
