# Production Security Checklist

- Set `NODE_ENV=production`.
- Set a unique random `JWT_SECRET`.
- Use a managed MongoDB URI with authentication and TLS.
- Set `FRONTEND_URL` to the exact HTTPS frontend origin.
- Keep Algorand recipient and facilitator values in deployment secrets.
- Never provide `AVM_PRIVATE_KEY` to the frontend or commit it to source control.
- Restrict backend CORS to the deployed frontend origin before going public.
- Put the backend and frontend behind HTTPS.
- Keep MongoDB private; expose only frontend and backend through the proxy.
- Rotate any wallet key that has ever been committed to a local `.env` file.
- Verify the x402 `AVM_NETWORK`, USDC ASA, recipient, and facilitator against the hackathon instructions before the demo.
- Test a rejected payment and confirm no agent invocation is created.
