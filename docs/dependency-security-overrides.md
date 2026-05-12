# Dependency Security Overrides

This document tracks temporary `pnpm.overrides` entries added to remediate Dependabot/npm advisory alerts.

| Override                         | Reason                                                                                                                      | Advisory                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `happy-dom: 20.8.9`              | Force patched version required by `@wyw-in-js/transform`                                                                    | GHSA-37j7-fg3j-429f, GHSA-w4gp-fjgq-3q4g, GHSA-6q6h-j7hj-3r64 |
| `lodash: 4.18.1`                 | Force patched version used by `@pigment-css/react`                                                                          | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh                      |
| `lodash-es: 4.18.1`              | Force patched version used by `react-color`                                                                                 | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh                      |
| `postcss: 8.5.14`                | Keep patched version in transitive dependencies (`next>postcss` was flagged), not just the root devDependency entry         | GHSA-qx2v-qp2m-jg93                                           |
| `brace-expansion@^1.1.0: 1.1.13` | Patch minimatch v3 transitive path                                                                                          | GHSA-f886-m6hf-6m8v                                           |
| `brace-expansion@^2.0.0: 2.0.3`  | Patch minimatch v9 transitive path                                                                                          | GHSA-f886-m6hf-6m8v                                           |
| `brace-expansion@^5.0.0: 5.0.6`  | Patch minimatch v10 transitive path                                                                                         | GHSA-f886-m6hf-6m8v                                           |
| `typescript-eslint: 8.57.2`      | Pin transitive `eslint-config-next` dependency to avoid unrelated lint rule behavior drift during this security-only change | Maintenance pin                                               |

## Verification

- `pnpm audit --json` reports `0` vulnerabilities (info/low/moderate/high/critical).
- `pnpm run lint` and `pnpm run type-check` pass after applying overrides.
