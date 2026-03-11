<!-- Generated: 2026-03-11 | Token estimate: ~300 -->

# Dependencies

## Runtime (CDN)

| Dependency | Version | Purpose                         | SRI |
| ---------- | ------- | ------------------------------- | --- |
| KaTeX      | 0.16.9  | Math rendering (LaTeX formulas) | Yes |

Fallback: `vendor/katex/` local copy

## Dev Dependencies (npm)

| Package                        | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| eslint ^9.0.0                  | Linting (flat config)                            |
| @eslint/js ^9.0.0              | ESLint recommended rules                         |
| prettier ^3.1.0                | Code formatting                                  |
| eslint-config-prettier ^10.0.0 | Disable ESLint rules that conflict with Prettier |

## npm Scripts

| Command                | Description                           |
| ---------------------- | ------------------------------------- |
| `npm run lint`         | ESLint check on js/, tests/, scripts/ |
| `npm run lint:fix`     | Auto-fix ESLint issues                |
| `npm run format`       | Prettier format all files             |
| `npm run format:check` | Check Prettier compliance             |
| `npm run verify`       | Run 130-case automated verification   |

## External Services

None. Fully offline, file:// protocol compatible.

## Browser APIs Used

- localStorage (config persistence, unit preferences)
- sessionStorage (disclaimer acceptance)
- Web Workers (2D sensitivity calculation)
- Canvas 2D (temperature chart, heatmap)
- SVG (pipe diagram with foreignObject inputs)
