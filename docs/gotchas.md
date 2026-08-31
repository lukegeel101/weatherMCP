# Weather MCP gotchas

## Keep installed dependencies out of Git

Issue: the first commit tracked 3,781 files under `node_modules`, making the repository noisy and difficult to review.

Verified fix: remove `node_modules` from Git tracking, preserve the local installation, add it to `.gitignore`, and verify that `npm ci` can reconstruct dependencies from `package-lock.json`.

## Preserve valid zero-degree temperatures

Issue: the original formatter used `period.temperature || "Unknown"`, so a valid numeric temperature of `0` was displayed as unknown.

Verified fix: use nullish fallback semantics and add a regression test that requires `0°F` to remain visible.

## Test protocol logic without starting stdio

Issue: the original module connected the MCP server as soon as it was imported, which coupled formatting and request logic to a live stdio process.

Verified fix: move pure URL, validation, formatting, and request helpers into `src/weather.ts`, keep connection startup in `src/index.ts`, and test the helpers with Node's built-in test runner and mocked responses.

## Split delete-and-add operations for one path

Issue: `apply_patch` rejected a combined patch that tried to delete and add `src/index.ts` in the same operation.

Verified fix: delete the old entry point in one patch, add the replacement in the next patch, and verify that no partial metadata edits were applied by the rejected patch.

## Isolate npm from a root-owned shared cache

Issue: the first clean reinstall removed the existing toolchain but could not refill it because npm's shared user cache contains root-owned temporary files.

Verified fix: run `npm ci --cache .npm-cache`, ignore that workspace-local cache, then rerun the build and complete test suite from the reconstructed lockfile installation.

## Migrate deprecated MCP tool registrations during SDK upgrades

Issue: upgrading the MCP SDK to a patched release removed all audit findings, but the deprecated `server.tool(...)` overload triggered an excessively deep TypeScript instantiation.

Verified fix: migrate both tools to the current `registerTool` configuration shape, align the direct Zod dependency with the SDK's supported current major, and rerun compilation and protocol tests.

## Audit the original SDK before releasing

Issue: the original `@modelcontextprotocol/sdk` 1.9.0 lockfile produced four npm audit findings, including two high-severity advisories in the direct SDK dependency.

Verified fix: upgrade the SDK to 1.30.0 and Zod to the compatible 4.x major, regenerate the lockfile, confirm zero audit findings, and pass all seven unit and stdio protocol tests.
