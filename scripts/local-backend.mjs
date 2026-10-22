// Keep-only local services. Docker Desktop can ignore bridge default bindings,
// so explicitly publish these containers on loopback after the CLI starts them.
import { execFileSync } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync } from "node:fs";

const root = fileURLToPath(new URL("../", import.meta.url));
const environmentFile = fileURLToPath(
  new URL("../.env.local", import.meta.url),
);
if (existsSync(environmentFile)) process.loadEnvFile(environmentFile);
const dockerHost = execFileSync(
  "docker",
  ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"],
  { encoding: "utf8" },
).trim();
if (!/^(npipe|unix):/.test(dockerHost))
  throw new Error("Use a local Docker engine for Keep");
const socketPath = dockerHost
  .replace(/^npipe:\/\//, "")
  .replace(/^unix:\/\//, "");

async function docker(method, path, body) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        socketPath,
        method,
        path,
        headers: body ? { "Content-Type": "application/json" } : {},
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          if (response.statusCode >= 400) {
            reject(
              new Error(
                `Docker ${method} ${path} failed (${response.statusCode})`,
              ),
            );
          } else {
            resolve(data ? JSON.parse(data) : null);
          }
        });
      },
    );
    request.on("error", reject);
    request.end(body ? JSON.stringify(body) : undefined);
  });
}

const networks = await docker("GET", "/networks");
if (!networks.some((network) => network.Name === "keep-local")) {
  await docker("POST", "/networks/create", {
    Name: "keep-local",
    Driver: "bridge",
    Options: { "com.docker.network.bridge.host_binding_ipv4": "127.0.0.1" },
  });
}

async function startContainer(name) {
  // Docker Desktop may retain a removed container's port proxy briefly.
  for (let attempt = 0; ; attempt++) {
    try {
      await docker("POST", `/containers/${name}/start`);
      return;
    } catch (error) {
      if (attempt === 5) throw error;
      await delay(1000);
    }
  }
}
try {
  execFileSync(
    process.execPath,
    [
      "node_modules/supabase/dist/supabase.js",
      "start",
      "--network-id",
      "keep-local",
      "--exclude",
      "realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor",
    ],
    { cwd: root, stdio: "pipe", maxBuffer: 16 * 1024 * 1024 },
  );
} catch {
  throw new Error(
    "Local Supabase could not start. Check Docker Desktop and run supabase start for diagnostics.",
  );
}

for (const name of [
  "supabase_db_keep",
  "supabase_kong_keep",
  "supabase_studio_keep",
  "supabase_inbucket_keep",
]) {
  const original = await docker("GET", `/containers/${name}/json`);
  const bindings = original.HostConfig.PortBindings ?? {};
  if (
    Object.values(bindings).every((ports) =>
      ports.every((port) => port.HostIp === "127.0.0.1"),
    )
  )
    continue;
  // Reject unexpected stacks or ephemeral database storage before recreating.
  if (
    original.Name !== `/${name}` ||
    !original.NetworkSettings.Networks["keep-local"]
  ) {
    throw new Error(`Unexpected container configuration for ${name}`);
  }
  if (
    name === "supabase_db_keep" &&
    !original.Mounts.some(
      (mount) =>
        mount.Name === name && mount.Destination === "/var/lib/postgresql/data",
    )
  ) {
    throw new Error("Keep database must use its persistent named volume");
  }
  const config = {
    ...original.Config,
    HostConfig: original.HostConfig,
    NetworkingConfig: {
      EndpointsConfig: {
        "keep-local": {
          Aliases: original.NetworkSettings.Networks["keep-local"].Aliases,
        },
      },
    },
  };
  const restricted = structuredClone(config);
  for (const ports of Object.values(restricted.HostConfig.PortBindings)) {
    for (const port of ports) port.HostIp = "127.0.0.1";
  }
  // The CLI writes gateway certificates and routes after container creation.
  const gatewayFiles =
    name === "supabase_kong_keep"
      ? execFileSync("docker", ["cp", `${name}:/home/kong/.`, "-"], {
          maxBuffer: 8 * 1024 * 1024,
        })
      : null;
  function restoreFiles() {
    if (gatewayFiles)
      execFileSync("docker", ["cp", "--archive", "-", `${name}:/home/kong/`], {
        input: gatewayFiles,
        stdio: ["pipe", "pipe", "pipe"],
      });
  }
  await docker("POST", `/containers/${name}/stop?t=20`);
  // Container removal retains named volumes; credentials stay in memory only.
  await docker("DELETE", `/containers/${name}`);
  try {
    await docker("POST", `/containers/create?name=${name}`, restricted);
    restoreFiles();
    await startContainer(name);
    for (let attempt = 0; attempt < 45; attempt++) {
      const current = await docker("GET", `/containers/${name}/json`);
      if (
        current.State.Running &&
        (!current.State.Health || current.State.Health.Status === "healthy")
      )
        break;
      if (attempt === 44) throw new Error(`${name} did not become healthy`);
      await delay(1000);
    }
  } catch (error) {
    // Restore the original service configuration if rebinding fails.
    const current = await docker("GET", "/containers/json?all=true");
    if (current.some((container) => container.Names.includes(`/${name}`))) {
      await docker("DELETE", `/containers/${name}?force=true`);
    }
    await docker("POST", `/containers/create?name=${name}`, config);
    restoreFiles();
    await startContainer(name);
    throw error;
  }
  console.log(`${name}: bound to 127.0.0.1`);
  if (name === "supabase_db_keep") {
    // Drop pooled connections to the previous database process before requests.
    for (const dependent of [
      "supabase_auth_keep",
      "supabase_rest_keep",
      "supabase_pg_meta_keep",
    ]) {
      await docker("POST", `/containers/${dependent}/restart?t=10`);
    }
  }
}
console.log(
  "Keep backend ready. API: http://127.0.0.1:55321; inbox: http://127.0.0.1:55324",
);
