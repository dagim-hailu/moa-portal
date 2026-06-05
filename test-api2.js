async function test() {
  const loginRes = await fetch("https://moa-portal-shell.vercel.app/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "admin", password: "password" })
  });
  const loginData = await loginRes.json();
  console.log("Login status:", loginRes.status);
  
  // Vercel returns the token in a cookie usually, but let's see if it returns it in JSON.
  // Wait, I looked at route.ts earlier and it sets the cookie. Let's extract the cookie.
  const setCookie = loginRes.headers.get("set-cookie");
  console.log("Set-Cookie:", !!setCookie);
  
  let token = "";
  if (setCookie) {
    const match = setCookie.match(/moa_access_token=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) {
     console.log("No token found in cookies! Body:", loginData);
     return;
  }

  const histRes = await fetch("https://moa-portal-server.onrender.com/api/chat/history?receiverId=00000000-0000-4000-8000-000000000004", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("History status:", histRes.status);
  const histText = await histRes.text();
  console.log("History body length:", histText.length);
  console.log("History body:", histText);
}
test().catch(console.error);
