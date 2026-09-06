# Dependency Security Overrides

This document tracks temporary `pnpm-workspace.yaml` `overrides` entries added to remediate Dependabot/npm advisory alerts.

| Override            | Reason                                                   | Advisory                                                      |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `happy-dom: 20.8.9` | Force patched version required by `@wyw-in-js/transform` | GHSA-37j7-fg3j-429f, GHSA-w4gp-fjgq-3q4g, GHSA-6q6h-j7hj-3r64 |

All previous `@babel/core`, `@humanfs/node`, `brace-expansion`, `eslint-plugin-react-hooks`, `fast-uri`, `js-yaml`, `lodash`, `lodash-es`, `typescript-eslint`, and `undici` overrides were removed after regenerating the dependency graph and confirming they were no longer required.

## Verification

- `pnpm audit` reports `0` vulnerabilities.
- `pnpm run lint` and `pnpm run type-check` pass after applying overrides.

**Last Updated**: September 6, 2026
