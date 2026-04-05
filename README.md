# Diabetes Ops Cockpit

Real-time diabetes monitoring dashboard powered by Nightscout.

## Features

- Blood glucose card with trend arrow
- IOB / COB visualization
- Basal rate + active temp target
- Loop status indicator (AAPS / AndroidAPS)
- Last meal / carb entry
- Anomaly alerts engine
- Pull-to-refresh + 5-minute auto-refresh

## Local Development

```bash
npm install
npm run dev
```

Create a `.env.local` file:

```
NIGHTSCOUT_URL=https://your-nightscout.example.com
NIGHTSCOUT_TOKEN=your_read_api_token
```

Open [http://localhost:3000](http://localhost:3000)

---

## Homelab Deployment (Docker / Portainer)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- A running [Nightscout](https://nightscout.github.io/) instance with an API token
- A Docker network named `homelab` (create with `docker network create homelab` if it doesn't exist)

### Quick Start

1. Copy the env template:

   ```bash
   cp .env.docker .env
   ```

2. Edit `.env` and set your Nightscout credentials:

   ```
   NIGHTSCOUT_URL=https://your-nightscout.example.com
   NIGHTSCOUT_TOKEN=your_api_token_here
   ```

3. Deploy with Docker Compose:

   ```bash
   docker compose up -d --build
   ```

   Or import `docker-compose.yml` as a stack in Portainer.

4. The app will be available at `http://your-host:3000`

### Health Check

The container exposes a healthcheck at `http://your-host:3000/api/health`.

### Environment Variables

| Variable         | Description                                      | Required |
| ---------------- | ------------------------------------------------ | -------- |
| `NIGHTSCOUT_URL` | Full URL of your Nightscout instance             | Yes      |
| `NIGHTSCOUT_TOKEN` | Nightscout API token (read-only is sufficient) | Yes      |

---

## Tech Stack

- Next.js 16 (App Router, standalone output)
- React 19
- TypeScript
- Tailwind CSS v4
- SWR for data fetching
