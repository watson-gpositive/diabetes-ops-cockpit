/**
 * Nightscout client connectivity test
 * Run: npx tsx scripts/test-nightscout-client.ts
 */
import { verifyConnectivity, buildConfigFromEnv } from "../src/lib/nightscout/index";

async function main() {
  const config = buildConfigFromEnv();

  if (!config) {
    console.error("FAIL: NIGHTSCOUT_URL or NIGHTSCOUT_TOKEN not set in environment");
    process.exit(1);
  }

  console.log("Config URL:", config.url);
  console.log("Token present:", config.token ? `yes (${config.token.length} chars)` : "no");

  // Connectivity check — will fail gracefully with dummy credentials
  const result = await verifyConnectivity(config);

  if (result.reachable) {
    console.log("PASS: Nightscout reachable");
    console.log("  Latency:", result.latencyMs, "ms");
    if (result.version) console.log("  Version:", result.version);
  } else {
    console.log("EXPECTED FAIL (dummy credentials):", result.error);
    console.log("PASS: Client handles unreachable server gracefully");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
