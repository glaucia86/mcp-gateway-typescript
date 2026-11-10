# Repository Guidelines

## Project Structure & Module Organization

This repository is an early-stage TypeScript MCP gateway with a fictional bank-branch server.

- `src/index.ts` and `src/status.ts`: gateway bootstrap and status reporting.
- `src/domain/branches.ts`: in-memory branch catalog and domain functions.
- `src/mcp/branches-server.ts`: MCP tool registration and input schemas.
- `src/mcp/branches-stdio.ts`: stdio transport entry point.
- Tests live beside source files as `*.test.ts`.
- `.agents/skills/`: repository-local agent guidance; `skills-lock.json` records installed skills.

Keep domain logic independent of MCP transport and tool registration. No application assets directory currently exists.

## Build, Test, and Development Commands

Run commands from the repository root:

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: execute the gateway bootstrap using `tsx`; this is not a watch command.
- `npm run mcp:branches`: start the branch MCP server over stdio.
- `npm run typecheck`: check TypeScript without emitting JavaScript.
- `npm test`: run the Vitest suite once.
- `npm test -- src/domain/branches.test.ts`: run a focused test file.

There is no build script; the project currently runs TypeScript directly.

## Coding Style & Naming Conventions

Follow `.editorconfig`: two-space indentation, UTF-8, and CRLF line endings. Match existing double quotes and semicolons. No linting or formatting tool is configured.

Use strict TypeScript and ESM with NodeNext resolution. Include `.js` extensions in relative imports and use `import type` for type-only imports. Use camelCase for functions and variables, PascalCase for types, kebab-case for multiword filenames, and snake_case for MCP tool names.

Validate external inputs with Zod at MCP boundaries. Prefer schema-derived types and narrowing over `any` or unchecked assertions.

## Testing Guidelines

Use Vitest with descriptive `describe` and `it` blocks. Follow red-green-refactor for behavior changes: confirm the new test fails, implement the change, then refactor. Test observable results, missing records, normalization, and invalid inputs. Prefer real domain functions over mocks. No coverage threshold is configured. Run tests and typecheck before submitting.

## Commit & Pull Request Guidelines

History is limited; the initialization commit uses `chore: ...`. Follow that concise, imperative style with prefixes such as `feat:`, `fix:`, `test:`, or `docs:`. Keep commits focused.

PRs should explain the change and its purpose, link related issues, and report validation commands and results. Highlight changes to tool names, schemas, or response shapes.

## Security & Configuration

Keep branch data fictional and credentials out of source control. Environment files are ignored; use `.env.example` for documented placeholders. Reserve stdout for MCP protocol messages; send diagnostics to stderr.
