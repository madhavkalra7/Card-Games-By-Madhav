# 🚀 Multiplayer Deployment Guide - Card Games By Madhav

## Why Room Creation Got Stuck on Vercel
**Vercel is a serverless platform.** It only runs static pages and serverless API functions. It **does not support long-lived WebSocket connections (Socket.io)** or persistent Node.js servers (`server/index.ts`). 

When you tried to create a room on Vercel, the browser attempted to connect to `https://your-vercel-app.vercel.app/socket.io/`, which Vercel rejected with 404/502. The socket was unable to reach a running game server, causing the button to remain in a loading state.

We have:
1. Added a **7-second fail-safe timeout** in the client so the button **never hangs indefinitely** and clearly displays connection errors.
2. Added `NEXT_PUBLIC_SOCKET_URL` support in the socket client.
3. Added a global `<Toast />` notification and connection status badges in the modals.
4. Moved `tsx` to production dependencies and prepared `render.yaml` for 1-click cloud deployment.

---

## Option 1: Deploy Full Game on Render.com (Recommended - 100% Free)
Render supports persistent Node.js servers with WebSockets out-of-the-box. Your project is already built as a **unified server** (`server/index.ts`) that runs both Next.js and Socket.io together on the same port!

1. Sign up / Log in to [Render.com](https://render.com) (free).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `madhavkalra7/Card-Games-By-Madhav`.
4. Configure the service:
   - **Name**: `card-games-by-madhav` (or any name)
   - **Environment**: `Node`
   - **Branch**: `master`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
5. Click **Create Web Service**.

Once deployed (takes ~2 minutes), Render gives you a public URL (e.g., `https://card-games-by-madhav.onrender.com`). Open this URL on your phone or desktop—rooms, live multiplayer, turns, and real-time Dukki Bazaar work immediately!

---

## Option 2: Keep Frontend on Vercel & Run Backend on Render / Railway
If you prefer to keep your frontend hosted on Vercel (`https://card-casino-km9bewp67-madhavkalra7s-projects.vercel.app`):

1. Follow **Option 1** above to deploy your repository to Render (e.g. `https://card-games-backend.onrender.com`).
2. Go to your **Vercel Dashboard** → Select the project (`card-casino`).
3. Navigate to **Settings** → **Environment Variables**.
4. Add a new variable:
   - **Key**: `NEXT_PUBLIC_SOCKET_URL`
   - **Value**: `https://card-games-backend.onrender.com` (your Render URL, no trailing slash)
5. Go to the **Deployments** tab on Vercel and click **Redeploy**.

The Vercel frontend will now seamlessly establish WebSocket connections with your Render game server!

---

## 🎙️ WebRTC Voice Chat Across Cellular & Remote Networks (Jio / Airtel / Wi-Fi)

Voice chat has been engineered with enterprise-grade resilience for cross-network mobile & desktop players:
- **Multi-Region Anycast STUN**: Google Public STUN (18ms latency) + Cloudflare Anycast STUN (30ms latency with Indian edge nodes in Mumbai, Delhi, Bangalore, Chennai) + Twilio + Nextcloud port 443.
- **TCP TURN Fallback**: OpenRelay TURN over TCP on ports 80 & 443 automatically pierces strict Carrier-Grade NAT (CGNAT) and symmetric firewalls.
- **Opus In-band Forward Error Correction (FEC)**: Reconstructs lost audio packets over cellular data (Jio/Airtel 4G/5G) so voices never sound robotic or chopped.
- **Auto-Reconnection**: Resilient ICE restart handles brief cellular handovers (Wi-Fi ↔ LTE ↔ 5G) without severing the call.

*(Optional)* If you wish to use your own dedicated TURN credentials (e.g. from [Metered.ca](https://www.metered.ca) or [Twilio](https://www.twilio.com)):
Add these variables in your Vercel or Render dashboard:
- `NEXT_PUBLIC_TURN_URL`: `turn:your-turn-domain.com:443?transport=tcp`
- `NEXT_PUBLIC_TURN_USERNAME`: `your-username`
- `NEXT_PUBLIC_TURN_CREDENTIAL`: `your-password`
