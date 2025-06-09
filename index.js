import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

const API_KEY = "5db0552c-5e1c-4d1a-a4b5-c112f2926c82"; // Dein Helius-Key
const PUMPFUN_PROGRAM = "GvHe5PZULUjzWyo9aYKfkntpRMrKkgoZWf8RmpA5pLsq";

app.use(cors());

app.get("/memecoins", async (req, res) => {
  try {
    const heliusRes = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "pump-tracker",
          method: "getTransactions",
          params: { account: PUMPFUN_PROGRAM, limit: 5 }
        })
      }
    );

    const data = await heliusRes.json();
    const simplified = (data.result || []).map((tx) => ({
      signature: tx.signature,
      timestamp: tx.timestamp,
      wallet: tx.description?.accounts?.[0],
      link: `https://solscan.io/tx/${tx.signature}`
    }));

    res.json(simplified);
  } catch (e) {
    console.error("Fehler:", e);
    res.status(500).json({ error: "Backend-Fehler" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server läuft auf Port ${port}`);
});