import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

const API_KEY = "5db0552c-5e1c-4d1a-a4b5-c112f2926c82"; // Dein Helius API Key
const PUMPFUN_PROGRAM = "GvHe5PZULUjzWyo9aYKfkntpRMrKkgoZWf8RmpA5pLsq";

app.use(cors());

let memecoins = []; // Zwischenspeicher für neue Memecoins

// Hilfsfunktion, um Token Mint Events aus Transaktionen zu filtern
function extractMintEvents(transactions) {
  const mints = [];

  for (const tx of transactions) {
    if (!tx.events) continue;
    for (const ev of tx.events) {
      // Prüfe auf Mint-Event (z.B. 'mint' oder 'tokenMint')
      if (ev.type === "mint" || ev.type === "tokenMint" || ev.type === "splTokenMint") {
        // Beispiel: ev.data enthält Mint-Adresse, Creator, ...
        mints.push({
          mint: ev.data.mint,
          creator: ev.data.creator || null,
          signature: tx.signature,
          timestamp: tx.timestamp,
          link: `https://solscan.io/tx/${tx.signature}`,
        });
      }
    }
  }

  return mints;
}

// Polling-Funktion: Alle 15 Sek neue Transaktionen abfragen
async function pollPumpfun() {
  try {
    const res = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "pump-tracker",
          method: "getTransactions",
          params: { account: PUMPFUN_PROGRAM, limit: 20 }
        }),
      }
    );

    const data = await res.json();

    if (!data.result) return;

    // Neue Mint Events herausfiltern
    const newMints = extractMintEvents(data.result);

    // Nur neu hinzugefügte mints behalten
    for (const mint of newMints) {
      if (!memecoins.find((c) => c.mint === mint.mint)) {
        memecoins.unshift(mint);
      }
    }

    // Speicher max. 50 Memecoins
    if (memecoins.length > 50) memecoins = memecoins.slice(0, 50);
  } catch (e) {
    console.error("Polling-Fehler:", e);
  }
}

setInterval(pollPumpfun, 15000);
pollPumpfun();

app.get("/memecoins", (req, res) => {
  res.json(memecoins);
});

app.listen(port, () => {
  console.log(`✅ Memecoin Tracker läuft auf Port ${port}`);
});
