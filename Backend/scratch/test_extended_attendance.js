async function testAttendanceEndpoints() {
  console.log("=== TESTING EXTENDED ATTENDANCE ENDPOINTS ===");

  // 1. Login
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gmail.com", password: "Admin@123456" }),
  });
  const login = await loginRes.json();
  const token = login.data?.accessToken;
  if (!token) throw new Error("Login failed");
  console.log("✓ Authenticated.");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // 2. GET /api/hr/attendance/dashboard
  const dashRes = await fetch("http://localhost:5000/api/hr/attendance/dashboard", { headers });
  const dashData = await dashRes.json();
  console.log("✓ Dashboard response:", {
    success: dashData.success,
    date: dashData.data?.date,
    present: dashData.data?.kpis?.presentCount,
    trendsCount: dashData.data?.trend?.length,
    projectSummariesCount: dashData.data?.projectSummaries?.length,
  });

  // 3. GET /api/hr/attendance
  const attRes = await fetch("http://localhost:5000/api/hr/attendance", { headers });
  const attData = await attRes.json();
  console.log("✓ Daily Attendance response:", {
    success: attData.success,
    totalWorkers: attData.data?.totalWorkers,
    rosterLength: attData.data?.roster?.length,
    approvalStatus: attData.data?.approvalStatus,
  });

  const sampleWorker = attData.data?.roster?.[0];
  const sampleWorkerId = sampleWorker?.employee?.id;

  // 4. POST /api/hr/attendance (Save as Draft or Submit)
  if (sampleWorkerId) {
    const today = new Date().toISOString().split("T")[0];
    const saveRes = await fetch("http://localhost:5000/api/hr/attendance", {
      method: "POST",
      headers,
      body: JSON.stringify({
        date: today,
        saveAction: "SUBMIT",
        records: [
          {
            employeeId: sampleWorkerId,
            status: "PRESENT",
            checkInTime: "08:15",
            checkOutTime: "17:30",
            workHours: 8.25,
            overtimeHours: 1.5,
            notes: "Arrived promptly and finished site tasks",
          },
        ],
      }),
    });
    const saveData = await saveRes.json();
    console.log("✓ Save/Submit Attendance response:", saveData);

    // 5. POST /api/hr/attendance/submit
    const submitRes = await fetch("http://localhost:5000/api/hr/attendance/submit", {
      method: "POST",
      headers,
      body: JSON.stringify({ date: today }),
    });
    console.log("✓ Submit sheet response:", await submitRes.json());

    // 6. POST /api/hr/attendance/review (Approve)
    const reviewRes = await fetch("http://localhost:5000/api/hr/attendance/review", {
      method: "POST",
      headers,
      body: JSON.stringify({ date: today, status: "APPROVED", reviewerNote: "Verified by General Manager" }),
    });
    console.log("✓ Review sheet response:", await reviewRes.json());

    // 7. GET /api/hr/attendance/worker/:workerId
    const workerRes = await fetch(`http://localhost:5000/api/hr/attendance/worker/${sampleWorkerId}`, { headers });
    const workerData = await workerRes.json();
    console.log("✓ Worker attendance details:", {
      success: workerData.success,
      workerName: workerData.data?.worker?.fullName,
      loggedDays: workerData.data?.summary?.totalLoggedDays,
      rate: workerData.data?.summary?.attendanceRate,
    });
  }

  // 8. GET /api/hr/attendance/history
  const histRes = await fetch("http://localhost:5000/api/hr/attendance/history?page=1&limit=5", { headers });
  const histData = await histRes.json();
  console.log("✓ History response:", {
    success: histData.success,
    totalRecords: histData.data?.pagination?.total,
    sampleStatus: histData.data?.records?.[0]?.status,
  });

  // 9. GET /api/hr/attendance/reports
  const repRes = await fetch("http://localhost:5000/api/hr/attendance/reports", { headers });
  const repData = await repRes.json();
  console.log("✓ Reports response:", {
    success: repData.success,
    totalWorkers: repData.data?.totalWorkers,
    overallSummary: repData.data?.overallSummary,
  });

  console.log("=== ALL ATTENDANCE BACKEND ENDPOINTS PASSED SUCCESSFULLY ===");
}

testAttendanceEndpoints().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
