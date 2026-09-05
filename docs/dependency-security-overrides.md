# Dependency Security Overrides

This document tracks temporary `pnpm-workspace.yaml` `overrides` entries added to remediate Dependabot/npm advisory alerts.

| Override                           | Reason                                                                                            | Advisory                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `@babel/core: 7.29.6`              | Force patched version used by Pigment/Jest/Sentry tooling                                         | Low-severity audit advisory                                   |
| `@humanfs/node: 0.16.8`            | Force patched version used by ESLint                                                              | Moderate audit advisory                                       |
| `happy-dom: 20.8.9`                | Force patched version required by `@wyw-in-js/transform`                                          | GHSA-37j7-fg3j-429f, GHSA-w4gp-fjgq-3q4g, GHSA-6q6h-j7hj-3r64 |
| `lodash: 4.18.1`                   | Force patched version used by `@pigment-css/react`                                                | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh                      |
| `lodash-es: 4.18.1`                | Force patched version used by `react-color`                                                       | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh                      |
| `brace-expansion@^1.1.0: 1.1.18`   | Patch minimatch v3 transitive path                                                                | GHSA-f886-m6hf-6m8v, GHSA-rgw5-rvv9-x895                      |
| `brace-expansion@^2.0.0: 2.1.4`    | Patch minimatch v9 transitive path                                                                | GHSA-f886-m6hf-6m8v, GHSA-rgw5-rvv9-x895                      |
| `brace-expansion@^5.0.0: 5.0.9`    | Patch minimatch v10 transitive path                                                               | GHSA-f886-m6hf-6m8v, GHSA-jxxr-4gwj-5jf2, GHSA-rgw5-rvv9-x895 |
| `fast-uri: 3.1.6`                  | Force patched version used by Sentry/Webpack schema tooling                                       | GHSA-q3j6-qgpj-74h6, GHSA-v39h-62p7-jpjc, GHSA-f65p-4m7j-42xc |
| `undici: 7.29.0`                   | Force patched version used by `cheerio`                                                           | GHSA-p88m-4jfj-68fv, GHSA-pr7r-676h-xcf6, GHSA-8xcm-r25x-g524 |
| `js-yaml: 3.15.2`                  | Force patched version used by Jest/Istanbul transitive tooling                                    | GHSA-h67p-54hq-rp68                                           |
| `eslint-plugin-react-hooks: 7.1.1` | Use the ESLint 10-compatible release pulled by `eslint-config-next`                               | Peer compatibility                                            |
| `typescript-eslint: 8.69.0`        | Keep `eslint-config-next` aligned with the direct ESLint 10-compatible TypeScript ESLint packages | Maintenance pin                                               |

## Verification

- `pnpm audit` reports `0` vulnerabilities.
- `pnpm run lint` and `pnpm run type-check` pass after applying overrides.
