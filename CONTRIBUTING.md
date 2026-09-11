# Contributing

1. Use Node.js 22.12+ and `npm ci`.
2. Create a focused branch from the current main branch.
3. Keep domain calculations pure and independent from UI, language and storage.
4. Add meaningful regression tests for changes to units, reaction handling, evidence credit, scope invalidation, imports or result status.
5. Update both message dictionaries for user-facing changes. Preserve real geometry when changing RTL layout.
6. Run `npm run format`, `npm run check` and `npm run format:check`.
7. Describe the problem, behavior and validation in the pull request. Update methodology/schema documentation if the behavior changes.

Do not introduce guessed capacities, safety probabilities, arbitrary dynamic multipliers or automatic approval from a complete input form. New structural-analysis modules require a defined scope, primary engineering references, independent benchmark cases and a qualified engineering review.

Keep tests, fictional fixtures and example data free of private facility information. Do not edit generated build output or commit local project exports. Preserve the lockfile and update it with dependency changes.
