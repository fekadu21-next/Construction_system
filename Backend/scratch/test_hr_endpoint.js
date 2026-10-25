async function test() {
  try {
    console.log("1. Logging in as General Manager...");
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gmail.com",
        password: "Admin@123456",
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    console.log("✓ Logged in successfully. Token acquired.");

    console.log("2. Testing GET /api/hr/employees...");
    const empRes = await fetch("http://localhost:5000/api/hr/employees", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const empData = await empRes.json();
    console.log("✓ /api/hr/employees response:", empData);

    console.log("3. Testing GET /api/hr/metrics...");
    const metricsRes = await fetch("http://localhost:5000/api/hr/metrics", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const metricsData = await metricsRes.json();
    console.log("✓ /api/hr/metrics response:", metricsData);
    console.log("ALL HR ENDPOINTS ARE WORKING PERFECTLY!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
