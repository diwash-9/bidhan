# Sharing the app with a friend (no account needed)

Share your locally-running Bidhan app over the internet using **Cloudflare Quick Tunnel**
(`trycloudflare.com`). No Cloudflare or GitHub account required. Your friend only needs the
URL — nothing to install or configure.

## Current session URL

```
https://flows-selective-streaming-animals.trycloudflare.com
```

> This URL is random and only lives as long as the tunnel process runs. If you restart the
> tunnel you get a new URL — update the link you send.

## How it works

The Docker frontend (nginx) serves the SPA and proxies `/api` to the backend on your machine.
Tunnelling port `5173` therefore exposes the whole app (frontend + API) through one URL.

## Steps to share

### 1. Start the app

```powershell
docker compose up --build -d
```

Wait until the frontend is reachable, then sanity-check:

```powershell
(Invoke-WebRequest http://localhost:5173 -UseBasicParsing).StatusCode        # 200
(Invoke-WebRequest http://localhost:5173/api/health -UseBasicParsing).StatusCode  # 200
```

### 2. Start the tunnel

`cloudflared` is installed at `C:\Program Files (x86)\cloudflared\cloudflared.exe`
(installed via `winget install Cloudflare.cloudflared`).

Run it in the foreground (easiest — keeps a visible window, prints the URL):

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5173
```

Or in the background, logging to a file:

```powershell
Start-Process -FilePath "C:\Program Files (x86)\cloudflared\cloudflared.exe" `
  -ArgumentList "tunnel","--url","http://localhost:5173","--no-autoupdate" `
  -RedirectStandardOutput "$env:TEMP\cloudflared.log" `
  -RedirectStandardError "$env:TEMP\cloudflared.err.log" -WindowStyle Hidden
```

Find the URL in the log:

```powershell
Select-String "trycloudflare.com" "$env:TEMP\cloudflared.err.log"
```

### 3. Verify and share

Open the `https://<random>.trycloudflare.com` URL from another device (e.g. phone on mobile
data) to confirm it works, then send it to your friend.

## Stopping

```powershell
Stop-Process -Name cloudflared
docker compose down
```

## Notes / gotchas

- Your PC must stay on and online while your friend uses the link.
- Quick Tunnels have no uptime guarantee and the URL changes on every restart.
- The URL is randomly generated; anyone with the link can access the app.
- Equivalent zero-install alternative using built-in Windows SSH:

  ```powershell
  ssh -R 80:localhost:5173 nokey@localhost.run
  ```

- Repo fix required for the Docker build: `frontend-react/.dockerignore` used to list
  `nginx.conf`, but `frontend-react/Dockerfile` COPYs that file. That line was removed so
  `docker compose build` succeeds.
