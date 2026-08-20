# AgentHub Deployment

This stack deploys the AgentHub frontend, backend, MongoDB, and all three AI agents. The paid endpoint is the backend `POST /api/orchestrate` route, protected by x402 on Algorand and settled in USDC.

## Local production smoke run

1. Copy `.env.production.example` to `.env`.
2. Replace every placeholder with real deployment values. Never commit private keys or `.env` files.
3. From this directory, run:

```powershell
docker compose --env-file .env -f compose.yml build
docker compose --env-file .env -f compose.yml up -d
```

4. Check:

```powershell
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/agents
```

5. Open `http://localhost:3000`.

## Hackathon deployment requirements

- Deploy the backend and `/api/orchestrate` endpoint on a public HTTPS host.
- Keep `AVM_NETWORK` on the Algorand network supplied by the hackathon/facilitator.
- Use the hackathon USDC ASA ID and an Algorand recipient address funded for fees.
- Set the frontend backend URL to the public backend URL.
- Put MongoDB on a persistent managed/private network volume.
- Configure HTTPS and restrict CORS to the frontend domain before submission.