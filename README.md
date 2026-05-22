# HCLS Velocity AI

A Next.js web application for tracking AI-focused use cases across the HCLS sales team. Use cases are pulled from Salesforce and surfaced here for reporting, ranking, and engagement tracking.

## Features

- **Dashboard**: Overview metrics — total use cases, total EACV, high-priority count, breakdown by district and reporting rank
- **AFE Use Case Tracker**: Full table of all `#ai`-tagged use cases with filters for district and reporting rank. Supports inline editing and CSV export/backup
- **By District**: Use case view scoped to a specific district
- **Manage**: Admin view for maintaining use case metadata and primary use case options
- **Priority Use Cases**: P1-P3 use cases with activity logging (status updates, meeting notes, blockers, etc.)
- **Team**: Weekly team activity view with member management (add/remove team members and their associated Snowflake accounts)
- **Account Detail**: Drill into a specific account to view events and use cases

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui + Base UI components
- Snowflake (`snowflake-sdk`) for data storage

## Database

Tables are created in `TEMP.VELOCITY_AI`:

- `USERS` — Team members with mapped Snowflake usernames
- `ACCOUNTS` — Customer accounts
- `EVENTS` — Meeting/event logs per account
- `USE_CASES` — Active use cases with priority, value, stage, and ownership
- `USE_CASE_ACTIVITY` — Activity/status updates on use cases
- `ACTION_ITEMS` — Action items linked to accounts, events, or use cases

AFE use cases (the `#ai`-tagged ones surfaced in the AFE Tracker) are sourced from Salesforce via a Snowflake view/table in `TEMP.VELOCITY_AI`.

### Districts

| Key | Label | DM |
|-----|-------|----|
| `LifeSciencesWest` | LS West | Olga Teplitsky |
| `LifeSciencesEast` | LS East | Joseph Klein |
| `HealthTech` | Healthtech | Nick Pereira |
| `StrategicHCLS` | Strategics | Nick Stefanow |
| `PayersProviders` | PayPro | Gretchen Fowler |

## Running Locally

```bash
npm install
SNOWFLAKE_CONNECTION_NAME=<your-connection> npm run dev
```

Set `SNOWFLAKE_DATABASE=TEMP` and `SNOWFLAKE_SCHEMA=VELOCITY_AI` if your connection defaults differ.

## Deployment to SPCS

The app is deployed to Snowpark Container Services using `velocity_ai_spcs.yaml` at the repo root.

1. Build and push the Docker image:
```bash
docker build -t velocity-ai .
docker tag velocity-ai sfcogsops-snowhouse-aws-us-west-2.registry.snowflakecomputing.com/temp/scuret/velocity_ai_images/velocity_ai:latest
docker push sfcogsops-snowhouse-aws-us-west-2.registry.snowflakecomputing.com/temp/scuret/velocity_ai_images/velocity_ai:latest
```

2. Create or replace the SPCS service using the spec file:
```sql
CREATE SERVICE velocity_ai
  IN COMPUTE POOL <your_compute_pool>
  FROM SPECIFICATION_FILE = @<your_stage>/velocity_ai_spcs.yaml;
```

The app listens on port `8000` and uses OAuth (`/snowflake/session/token`) when running in SPCS.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SNOWFLAKE_CONNECTION_NAME` | Named connection for local dev | — |
| `SNOWFLAKE_DATABASE` | Database name | `TEMP` |
| `SNOWFLAKE_SCHEMA` | Schema name | `VELOCITY_AI` |
| `SNOWFLAKE_WAREHOUSE` | Warehouse name | `SE_AD_WH` |
| `SNOWFLAKE_ACCOUNT` | Account identifier (fallback) | `SFSENORTHAMERICA-CCAUDILL-AWS2` |
