// AETHEROSMC destek formu -> Discord kanalı köprüsü (Cloudflare Worker)
// Discord webhook adresi kodda değil, Worker'ın "https://discord.com/api/webhooks/1565059385661718668/JegZ5_G9kkLeq4Km4G70MrDDTgxZkwZqzuKDPsez5CbTHiXRPNRKp23sRwocMiSg0M7X" gizli değişkeninde durur.

// Sitenin yayınlandığı adres(ler). Başında https:// olsun, sonunda / OLMASIN.
const ALLOWED_ORIGINS = [
  "https://SITENIN-ADRESI.com",
  "https://www.SITENIN-ADRESI.com"
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    const reply = (text, status = 200) => new Response(text, { status, headers: cors });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST" || !ALLOWED_ORIGINS.includes(origin)) return reply("Yasak", 403);

    let d;
    try { d = await request.json(); } catch { return reply("Hatalı istek", 400); }

    const clean = (v, n) => String(v ?? "").trim().slice(0, n);
    const username = clean(d.username, 32);
    const category = clean(d.category, 40);
    const title = clean(d.title, 100);
    const message = clean(d.message, 2000);
    if (!username || !category || !title || !message) return reply("Eksik alan", 400);

    const res = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allowed_mentions: { parse: [] }, // @everyone / rol etiketlerini engeller
        embeds: [{
          title,
          description: message,
          color: 0x5b8cff,
          fields: [
            { name: "Minecraft Kullanıcı Adı", value: username, inline: true },
            { name: "Kategori", value: category, inline: true }
          ],
          footer: { text: "AETHEROSMC Web Destek Formu" },
          timestamp: new Date().toISOString()
        }]
      })
    });

    return res.ok ? reply("OK") : reply("Discord hatası", 502);
  }
};
