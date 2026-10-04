import assert from "node:assert/strict";
import { test } from "node:test";
import { deploymentConfig, deployApplications } from "./deploy-coolify.mjs";

const env = {
  COOLIFY_URL: "https://coolify.example.com",
  COOLIFY_TOKEN: "test-only",
  COOLIFY_API_APP_UUID: "api-id",
  COOLIFY_WEB_APP_UUID: "web-id",
  GITHUB_SHA: "a".repeat(40),
  GITHUB_REPOSITORY: "owner/portfolio",
};
const config = deploymentConfig(env);
const json = (value) => Response.json(value);

test("configuration rejects missing values, non-HTTPS origins and invalid revisions", () => {
  for (const origin of ["http://coolify.example.com", "https://user:secret@coolify.example.com", "https://coolify.example.com/api"])
    assert.throws(() => deploymentConfig({ ...env, COOLIFY_URL: origin }));
  assert.throws(() => deploymentConfig({ ...env, GITHUB_SHA: "main" }));
  assert.throws(() => deploymentConfig({ ...env, COOLIFY_TOKEN: "" }));
  assert.throws(() => deploymentConfig({ ...env, COOLIFY_WEB_APP_UUID: env.COOLIFY_API_APP_UUID }));
  assert.throws(() => deploymentConfig({ ...env, COOLIFY_WEB_APP_UUID: "web/id" }));
});

test("transient read failures are retried, but deployment requests are not", async () => {
  let reads = 0;
  let deployments = 0;
  await assert.rejects(deployApplications(config, {
    sleep: async () => {}, log: () => {},
    fetch: async (url, options) => {
      const path = new URL(url).pathname;
      if (options.method === "GET" && path.startsWith("/api/v1/applications/")) {
        if (++reads === 1) return new Response(null, { status: 503 });
        const service = path.endsWith("api-id") ? "api" : "web";
        return json({ git_repository: null, docker_registry_image_name: `ghcr.io/owner/portfolio-${service}` });
      }
      if (options.method === "PATCH") return json({});
      deployments++;
      throw new Error("connection interrupted");
    },
  }), /inspect its status/);
  assert.equal(reads, 3);
  assert.equal(deployments, 1);
});

test("both image applications are validated before deploying API, then web", async () => {
  const events = [];
  await deployApplications(config, {
    sleep: async () => {}, log: () => {},
    fetch: async (url, options) => {
      const path = new URL(url).pathname;
      if (path.startsWith("/api/v1/applications/")) {
        const service = path.endsWith("api-id") ? "api" : "web";
        events.push(`${options.method}-${service}`);
        if (options.method === "PATCH") {
          assert.deepEqual(JSON.parse(options.body), { docker_registry_image_tag: `sha-${env.GITHUB_SHA}` });
          return json({ uuid: `${service}-id` });
        }
        return json({ git_repository: null, docker_registry_image_name: `ghcr.io/owner/portfolio-${service}`, docker_registry_image_tag: "previous" });
      }
      if (path === "/api/v1/deploy") {
        const uuid = new URL(url).searchParams.get("uuid");
        events.push(`deploy-${uuid}`);
        return json({ deployments: [{ resource_uuid: uuid, deployment_uuid: `deployment-${uuid}` }] });
      }
      if (path.startsWith("/api/v1/deployments/")) return json({ status: "finished" });
      events.push("public-health");
      return json({ status: "ok", revision: env.GITHUB_SHA });
    },
  });
  assert.deepEqual(events, ["GET-api", "GET-web", "PATCH-api", "deploy-api-id", "public-health", "PATCH-web", "deploy-web-id", "public-health"]);
});

test("a source-build target is rejected before any configuration is changed", async () => {
  await assert.rejects(deployApplications(config, {
    fetch: async (_url, options) => {
      assert.equal(options.method, "GET");
      return json({ git_repository: "owner/portfolio", docker_registry_image_name: "ghcr.io/owner/portfolio-api" });
    },
  }), /Refusing a source build/);
});

test("failed API deployment never starts the web deployment", async () => {
  const deployed = [];
  await assert.rejects(deployApplications(config, {
    sleep: async () => {}, log: () => {},
    fetch: async (url, options) => {
      const path = new URL(url).pathname;
      if (path.startsWith("/api/v1/applications/")) {
        const service = path.endsWith("api-id") ? "api" : "web";
        return json({ git_repository: null, docker_registry_image_name: `ghcr.io/owner/portfolio-${service}` });
      }
      if (path === "/api/v1/deploy") {
        const uuid = new URL(url).searchParams.get("uuid");
        deployed.push(uuid);
        return json({ deployments: [{ resource_uuid: uuid, deployment_uuid: "failed-build" }] });
      }
      return json({ status: "failed" });
    },
  }), /next service has not been deployed/);
  assert.deepEqual(deployed, ["api-id"]);
});

test("an old healthy release is not accepted as the new release", async () => {
  await assert.rejects(deployApplications(config, {
    sleep: async () => {}, log: () => {},
    fetch: async (url) => {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/api/v1/applications/")) {
        const service = parsed.pathname.endsWith("api-id") ? "api" : "web";
        return json({ git_repository: null, docker_registry_image_name: `ghcr.io/owner/portfolio-${service}` });
      }
      if (parsed.pathname === "/api/v1/deploy")
        return json({ deployments: [{ resource_uuid: "api-id", deployment_uuid: "release" }] });
      if (parsed.pathname.startsWith("/api/v1/deployments/")) return json({ status: "finished" });
      return json({ status: "ok", revision: "previous" });
    },
  }), /public health endpoint/);
});
