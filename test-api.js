const fetch = require('node-fetch');

async function test() {
  const loginRes = await fetch("https://moa-portal-server.onrender.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "admin", password: "password" })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log("Token obtained:", !!token);

  const histRes = await fetch("https://moa-portal-server.onrender.com/api/chat/history?receiverId=00000000-0000-4000-8000-000000000004", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("History status:", histRes.status);
  const histText = await histRes.text();
  console.log("History body:", histText.substring(0, 500));
}
test().catch(console.error);
