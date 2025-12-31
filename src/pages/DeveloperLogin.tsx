export default function DeveloperLogin() {
  const login = async () => {
    const res = await fetch("https://school-pay-pro.onrender.com/dev/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "PRO-2025-ADMIN-MASTER",
        password: "Dev123"
      })
    });

    const data = await res.json();
    console.log("LOGIN RESULT:", data);
    alert(JSON.stringify(data));
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Developer Login Test</h2>
      <button onClick={login}>LOGIN</button>
    </div>
  );
}
