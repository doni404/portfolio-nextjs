import { pathToFileURL } from "node:url";

export function deploymentConfig(env) {
  const origin = new URL(env.COOLIFY_URL || "");
  if (origin.protocol !== "https:" || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash)
    throw new Error("COOLIFY_URL must be an HTTPS origin without credentials or a path.");
  if (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || ""))
    throw new Error("A full Git commit SHA is required.");
  if (!/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY || ""))
    throw new Error("GITHUB_REPOSITORY must identify the image repository.");
  for (const key of ["COOLIFY_TOKEN", "COOLIFY_API_APP_UUID", "COOLIFY_WEB_APP_UUID"])
    if (!env[key]) throw new Error(`${key} is required.`);
  for (const key of ["COOLIFY_API_APP_UUID", "COOLIFY_WEB_APP_UUID"])
    if (!/^[a-zA-Z0-9-]+$/.test(env[key])) throw new Error(`${key} is invalid.`);
  if (env.COOLIFY_API_APP_UUID === env.COOLIFY_WEB_APP_UUID)
    throw new Error("API and web must use different applications.");
  return {
    origin: origin.origin,
    token: env.COOLIFY_TOKEN,
    revision: env.GITHUB_SHA,
    imageRoot: `ghcr.io/${env.GITHUB_REPOSITORY.toLowerCase()}`,
    applications: [
      { service: "api", uuid: env.COOLIFY_API_APP_UUID, health: `${env.NEXT_PUBLIC_API_URL || "https://api.doniputra.com"}/api/health` },
      { service: "web", uuid: env.COOLIFY_WEB_APP_UUID, health: `${env.NEXT_PUBLIC_SITE_URL || "https://doniputra.com"}/api/health` },
    ],
  };
}

export async function deployApplications(config, options = {}) {
  const request = options.fetch || fetch;
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const log = options.log || console.log;
  const attempts = options.attempts ?? 80;
  const tag = `sha-${config.revision}`;

  async function api(path, method = "GET", body) {
    // Only reads are retried; a timed-out mutation may already have succeeded.
    const retries = method === "GET" ? 3 : 1;
    for (let attempt = 0; attempt < retries; attempt++) {
      let response;
      try {
        response = await request(`${config.origin}/api/v1${path}`, {
          method,
          headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: AbortSignal.timeout(30_000),
        });
      } catch {
        if (attempt + 1 === retries) throw new Error(`Coolify ${method} ${path} could not be reached; inspect its status before retrying.`);
      }
      if (response?.ok) return response.json();
      if (response && (![429, 502, 503, 504].includes(response.status) || attempt + 1 === retries))
        throw new Error(`Coolify ${method} ${path} returned HTTP ${response.status}.`);
      await sleep(5_000 * (attempt + 1));
    }
  }

  // Validate both targets before changing either application's release.
  const targets = [];
  for (const application of config.applications) {
    const current = await api(`/applications/${application.uuid}`);
    const image = `${config.imageRoot}-${application.service}`;
    if (current.build_pack !== "dockerimage" || current.docker_registry_image_name !== image)
      throw new Error(`${application.service}: configure a Docker Image application for ${image} first. Refusing a source build.`);
    const health = new URL(application.health);
    if (health.protocol !== "https:" || health.username || health.password)
      throw new Error("Production health checks must use HTTPS without credentials.");
    targets.push({ ...application, image, previous: current.docker_registry_image_tag });
  }

  for (const target of targets) {
    log(`${target.service}: ${target.previous || "latest"} -> ${tag}`);
    await api(`/applications/${target.uuid}`, "PATCH", { docker_registry_image_tag: tag });
    const queued = await api(`/deploy?uuid=${encodeURIComponent(target.uuid)}`, "POST");
    const uuid = queued.deployments?.find((item) => item.resource_uuid === target.uuid)?.deployment_uuid;
    if (!uuid) throw new Error(`${target.service}: Coolify did not return a deployment UUID.`);
    log(`${target.service}: deployment ${uuid}`);

    let finished = false;
    for (let attempt = 0; attempt < attempts; attempt++) {
      await sleep(15_000);
      const deployment = await api(`/deployments/${uuid}`);
      if (["failed", "cancelled", "canceled"].includes(deployment.status))
        throw new Error(`${target.service}: deployment ${uuid} ${deployment.status}. The next service has not been deployed.`);
      if (deployment.status === "finished") { finished = true; break; }
    }
    if (!finished) throw new Error(`${target.service}: timed out waiting for ${uuid}; check Coolify before retrying.`);

    let healthy = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      try {
        const response = await request(target.health, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
        if (response.ok) {
          const result = await response.json();
          if (result.status === "ok" && result.revision === config.revision) { healthy = true; break; }
        }
      } catch { /* Allow the proxy a short window to route to the healthy replacement. */ }
      await sleep(5_000);
    }
    if (!healthy) throw new Error(`${target.service}: the public health endpoint is not serving ${config.revision}.`);
    log(`${target.service}: healthy at ${config.revision}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await deployApplications(deploymentConfig(process.env)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
