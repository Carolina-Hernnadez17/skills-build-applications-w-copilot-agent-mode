# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Build route-specific React components that use the shared API client and render loading, empty, success, and accessible error states.
- Logic tier decision: Keep Express routes thin and place validation and MongoDB behavior in explicit service functions.
- Data tier decision: Define required Mongoose fields and defaults in the schemas; keep seed data stable with idempotent upserts.
- Activity tracking approach: Validate `userId` and `teamId` as ObjectIds and as existing records, require a positive minute count, compute `points` from submitted minutes, and set `occurredAt` at creation.
- Team management approach: Reject missing names with `400`, preserve submitted names and mascots, validate optional member IDs, and keep a default empty members array.
- Leaderboard approach: Aggregate stored activity points by team ID, sort totals highest first, break ties deterministically, and add 1-based ranks.
- Workout suggestions approach: Find the matching seeded user by email, derive focus from fitness goal or recent activity, return matching workouts, include an explanatory reason, and return `404` for unknown users.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`; result: 5/5 passing. It verifies Mongoose validation and idempotent seeded data.
- API command: `npm run test:api --prefix octofit-tracker/backend`; result: 4/4 passing. It verifies activity/team contracts, leaderboard ordering, workout matching, and 4xx input failures.
- Frontend command: `npm test --prefix octofit-tracker/frontend`; result: 15/15 passing. It verifies API rendering plus loading, empty, and accessible error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`; result: passing.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`; result: passing.
