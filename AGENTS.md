# AGENTS.md

## Project intent

This repository implements the Elite Dev technical challenge: a deliberately scoped full-stack cinema screening and ticketing platform.

Prioritize, in this order:

1. complete end-to-end correctness;
2. domain integrity and security;
3. explicit, explainable engineering decisions;
4. maintainable implementation;
5. polished evaluator experience;
6. optional features only after the MVP is complete.

Do not expand scope unless explicitly requested.

## Source of truth

Before planning or implementing meaningful changes, read the relevant files under `docs/`.

Start with:

- `docs/00-INDEX.md`
- `docs/01-PRODUCT-SPEC.md`
- `docs/02-FUNCTIONAL-SPEC.md`
- `docs/03-TECHNICAL-ARCHITECTURE.md`
- `docs/04-DOMAIN-MODEL.md`
- `docs/05-API-CONTRACTS.md`
- `docs/06-UX-UI-SPEC.md`
- `docs/07-ACCEPTANCE-TESTS.md`
- `docs/08-ARCHITECTURE-DECISIONS.md`
- `docs/12-REQUIREMENTS-TRACEABILITY.md`
- `docs/13-SECURITY-CONCURRENCY-CHECKLIST.md`

`docs/09-CODEX-CONTEXT.md` records the operational context used during AI-assisted implementation.

If docs and code disagree, do not silently choose one. Identify the conflict and resolve it deliberately.

## Architecture

Non-negotiable decisions:

- TypeScript.
- React + Next.js App Router.
- Modular monolith.
- PostgreSQL + Prisma.
- TMDb external catalog.
- Cinema / seated-session scope.
- Business/domain logic belongs in `src/modules/**`.
- Avoid giant route handlers and business logic inside React components.
- Do not introduce microservices, Redis, WebSockets, real payments, or unrelated infrastructure without explicit approval.

## Authentication boundary

Better Auth is infrastructure behind an application-owned adapter.

The only public server-side auth entry point is:

`src/modules/auth/index.ts`

It exposes:

- `getSession(req)`
- `requireUser(req)`
- `requireRole(req, role)`
- `requireOwner(req, resourceOwnerId)`

No application module outside `src/modules/auth/**` may import `better-auth` directly.

Minimal framework bootstrap wiring is allowed only when structurally required and must remain owned by the auth module design.

Authorization must always be enforced server-side. Hidden UI controls are not authorization.

## Seat and checkout invariants

- Seat states are only `AVAILABLE` and `SOLD`.
- There is no `HELD`.
- There are no WebSockets.
- The seat map polls availability about every 7 seconds while mounted.
- Polling merges server state without resetting valid local selections.
- If a selected seat becomes `SOLD`, remove only that seat and notify the user.
- Stop polling when leaving the seat map / navigating to checkout.
- Polling improves UX only; the backend/database is authoritative.
- Two buyers must never successfully purchase the same event seat.
- A checkout seat conflict returns HTTP `409` with `SEAT_UNAVAILABLE`.
- Multi-seat checkout must not create accidental partial purchases.

## Payment invariants

- Payment is simulated and deterministic.
- Approved and declined cases must be reproducible.
- Never use random payment approval.
- Do not persist full card numbers or CVV.
- Declined payment must not consume seats or create usable tickets.

## Ticket and check-in invariants

- QR validation uses a cryptographically random opaque token.
- Do not use predictable database IDs as ticket security.
- Store the validation-token hash where practical.
- Manual code is separate and human-friendly.
- Share token is separate from validation token.
- Sharing does not transfer ownership.

Check-in results:

- `VALID`
- `INVALID`
- `ALREADY_USED`
- `WRONG_EVENT`

Valid check-in must atomically consume the ticket.

Two concurrent validations of the same unused ticket must yield exactly one `VALID`; the other must be `ALREADY_USED`.

`WRONG_EVENT` must never consume the ticket.

## TMDb boundary

Only server-side catalog code communicates with TMDb credentials.

Application catalog capabilities:

- `searchMovies(query)`
- `getMovieDetails(movieId)`
- `getMovieVideos(movieId)`

Normalize TMDb responses into application-owned DTOs.

Persist the movie data needed by created events so published events do not depend on a future live TMDb request.

During organizer movie selection, show movie details and an available trailer/video in a modal. Missing trailer is a valid non-blocking state.

## Visual direction

Avoid:

- Netflix-like red/black streaming identity;
- generic streaming clone layouts;
- generic SaaS dashboards;
- gratuitous KPI cards and blue/purple gradients.

Target:

- independent cinema programming;
- printed admission ticket;
- editorial hierarchy;
- paper-toned surfaces;
- high typographic contrast.

Role-specific UX:

- customer: discovery, seats, checkout, tickets;
- organizer: efficient creation/management;
- gate: focused scanner/manual validation with immediate feedback.

Reuse interaction patterns where useful: responsive auto-fill/minmax grids, poster overlays, skeleton loading, sticky blurred header, and mobile-collapsed filters/navigation.

### Approved design handoff

For UI implementation, read the approved design specifications under `docs/design/`:

- `docs/design/README.md`
- `docs/design/BRAND-SPEC.md`
- `docs/design/DESIGN-SPEC.md`
- `docs/design/SCREEN-INVENTORY.md`
- `docs/design/DESIGN-DECISIONS.md`
- `docs/design/UI-TOKENS.md`

Approved visual references are:

#### Customer

- `docs/design/customer/event-detail-and-seat-selection.png`
- `docs/design/customer/checkout-and-payment-states.png`
- `docs/design/customer/ticket-and-shared-ticket.png`

#### Organizer

- `docs/design/organizer/sessions-and-configuration.png`
- `docs/design/organizer/tmdb-movie-selection.png`

#### Gate / Check-in

- `docs/design/gate/gate-scanner-desktop.png`
- `docs/design/gate/gate-results-desktop.png`
- `docs/design/gate/gate-flow-mobile.png`

#### Authentication

- `docs/design/auth/login.png`

### Approved implementation assets

Implementation-ready brand assets live under:

- `public/brand/logo.svg` — primary logo for light surfaces
- `public/brand/logo-inverse.svg` — inverse logo for dark operational surfaces
- `public/brand/logo-mark.svg` — compact brand mark
- `public/brand/favicon.svg` — browser/favicon variant derived from the approved brand mark
- `public/brand/opengraph-image.png` — social/Open Graph preview image

Approved fallback assets live under:

- `public/placeholders/poster-unavailable.png` — fallback when TMDb does not provide a usable movie poster
- `public/placeholders/avatar-default.png` — default visual avatar

Prefer these supplied assets over generating replacements.

Asset usage does not imply additional product functionality.

In particular:

- `poster-unavailable.png` is only a visual fallback for missing TMDb artwork;
- `avatar-default.png` does not imply avatar upload or profile-image management;
- `opengraph-image.png` is intended for application metadata/social preview;
- `logo-inverse.svg` should be preferred on dark gate/check-in surfaces where appropriate.

Do not regenerate equivalent logos, icons, posters, avatars, or brand artwork unless an existing asset is technically unusable.

The design Markdown files define the approved visual system, component behavior, responsive intent, accessibility guidance, and screen inventory.

The PNG files are approved **visual and interaction references**, not an independent source of product scope.

When image copy or controls conflict with the product, functional, architecture, domain, API, acceptance, or security documentation, the written specifications win.

Do not add features merely because residual mockup copy suggests them. Examples of non-MVP functionality that may still appear in visual artifacts include:

- reports or analytics;
- generic configuration/backoffice areas;
- password recovery;
- e-mail delivery;
- watchlists/favorites;
- temporary seat holds or countdown timers;
- manual admission without a valid ticket;
- unrelated customer or organizer navigation.

Such residual copy should be removed or rewritten during implementation rather than converted into new application functionality.

Preserve the established Projeção visual language, hierarchy, spacing intent, role-specific shells, printed-ticket treatment, seat-map treatment, and check-in status clarity.

The visual design may be adapted when required by technical feasibility, accessibility, real content length, or responsive behavior, but do not independently redesign the established brand or core screen composition without a concrete reason.

## Working rules

Before changing code:

1. inspect the existing implementation;
2. read the relevant docs;
3. identify affected domain invariants;
4. make the smallest coherent change that satisfies the requirement.

Do not replace documented decisions just because another approach is more common.

If a documented decision creates a real blocker, report it and explain the trade-off before changing direction.

Avoid speculative abstractions and unnecessary dependencies.

Prefer application-owned types over leaking vendor-specific types across modules.

## Subagents

Use subagents mainly for bounded or independently verifiable work such as:

- repository exploration;
- security review;
- database/concurrency review;
- test-gap analysis;
- accessibility review;
- requirement traceability;
- independent code review.

Be conservative with parallel write-heavy work on overlapping files.

The main agent owns architectural consistency and must synthesize subagent findings.

## Validation

Use the actual scripts defined in `package.json`.

Before a milestone is complete, run the applicable:

- lint;
- type checking;
- unit/integration tests;
- relevant E2E tests;
- production build.

Never claim a command passed unless it was actually run successfully.

Prioritize automated tests for:

- role enforcement;
- organizer ownership;
- concurrent seat purchase;
- declined payment;
- valid check-in;
- duplicate check-in;
- wrong-event validation;
- invalid ticket token/code.

## Git and documentation

Keep changes small, reviewable, and logically scoped.

Prefer descriptive commits that show the development process.

Do not squash or rewrite history unless explicitly requested.

When a meaningful architecture/product decision changes, update the relevant file under `docs/`.

Document known limitations instead of hiding them.

The final README must make evaluation easy: setup, env vars, database, seed users, payment test values, main flows, tests, known limitations, deployment, and AI usage.

## Documentation and language

The product language and human-facing repository documentation language is Brazilian Portuguese (`pt-BR`).

`AGENTS.md` is intentionally kept in English as an operational instruction file for coding agents and does not need to be translated unless explicitly requested.

When creating or updating documentation:

- write explanatory prose in Brazilian Portuguese;
- write README content in Brazilian Portuguese;
- write architecture decisions and AI-usage documentation in Brazilian Portuguese;
- keep code identifiers, types, function names, database fields and technical domain codes in English;
- preserve official library/API terminology when translation would reduce precision.

User-facing application copy should be written in natural Brazilian Portuguese.

Examples of domain identifiers that remain in English:

- `AVAILABLE`
- `SOLD`
- `VALID`
- `INVALID`
- `ALREADY_USED`
- `WRONG_EVENT`
- `SEAT_UNAVAILABLE`

Do not translate code merely to match the documentation language.