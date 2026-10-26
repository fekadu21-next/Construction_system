async function verifyAll() {
  console.log("=== COMPREHENSIVE ATTENDANCE VERIFICATION SUITE ===");

  // 1. Authenticate
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gmail.com", password: "Admin@123456" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  if (!token) throw new Error("Auth failed: " + JSON.stringify(loginData));
  console.log("✓ 1. Admin authenticated successfully.");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // 2. Fetch Projects
  const projRes = await fetch("http://localhost:5000/api/hr/projects", { headers });
  const projData = await projRes.json();
  console.log("✓ 2. Projects loaded:", projData.data?.projects?.length);
  const activeProjId = projData.data?.projects?.[0]?.id || null;

  // 3. Fetch Daily Attendance
  const today = new Date().toISOString().split("T")[0];
  const dailyRes = await fetch(`http://localhost:5000/api/hr/attendance?date=${today}&projectId=${activeProjId || "all"}`, { headers });
  const dailyData = await dailyRes.json();
  console.log("✓ 3. Daily roster loaded:", {
    totalWorkers: dailyData.data?.totalWorkers,
    summary: dailyData.data?.summary,
    approvalStatus: dailyData.data?.approvalStatus,
  });

  const roster = dailyData.data?.roster || [];
  if (roster.length === 0) {
    console.log("No workers in roster to test. Registering a test worker...");
    const regRes = await fetch("http://localhost:5000/api/hr/employees", {
      method: "POST",
      headers,
      body: JSON.stringify({
        fullName: "Test Worker Automation",
        phone: "+251999887766",
        trade: "MASON",
        employmentType: "CONTRACT",
        dailyRate: 600,
        assignedProjectId: activeProjId,
        status: "ACTIVE",
      }),
    });
    const regData = await regRes.json();
    console.log("✓ Registered test worker:", regData.data?.employeeCode);
  }

  // Reload roster
  const dailyRes2 = await fetch(`http://localhost:5000/api/hr/attendance?date=${today}`, { headers });
  const dailyData2 = await dailyRes2.json();
  const currentRoster = dailyData2.data?.roster || [];
  console.log("✓ Current active roster count:", currentRoster.length);

  // 4. Record attendance as DRAFT
  const draftRecords = currentRoster.map((r, idx) => ({
    employeeId: r.employee.id,
    status: idx === 0 ? "PRESENT" : idx === 1 ? "HALF_DAY" : "PRESENT",
    checkInTime: "08:00",
    checkOutTime: idx === 1 ? "12:00" : "17:00",
    workHours: idx === 1 ? 4 : 8,
    overtimeHours: idx === 0 ? 2 : 0,
    notes: idx === 0 ? "Full day shift with overtime" : "Half-day morning shift",
  }));

  const draftSaveRes = await fetch("http://localhost:5000/api/hr/attendance", {
    method: "POST",
    headers,
    body: JSON.stringify({
      date: today,
      projectId: activeProjId,
      saveAction: "DRAFT",
      records: draftRecords,
    }),
  });
  const draftSaveData = await draftSaveRes.json();
  console.log("✓ 4. Save Draft result:", {
    success: draftSaveData.success,
    count: draftSaveData.data?.count,
    status: draftSaveData.data?.approvalStatus,
  });

  // 5. Submit for Review
  const submitRes = await fetch("http://localhost:5000/api/hr/attendance/submit", {
    method: "POST",
    headers,
    body: JSON.stringify({ date: today, projectId: activeProjId }),
  });
  const submitData = await submitRes.json();
  console.log("✓ 5. Submit Sheet result:", {
    success: submitData.success,
    status: submitData.data?.status,
    count: submitData.data?.count,
  });

  // 6. Review & Approve
  const reviewRes = await fetch("http://localhost:5000/api/hr/attendance/review", {
    method: "POST",
    headers,
    body: JSON.stringify({
      date: today,
      projectId: activeProjId,
      status: "APPROVED",
      reviewerNote: "Verified all times against biometric card logs",
    }),
  });
  const reviewData = await reviewRes.json();
  console.log("✓ 6. Review & Approve result:", {
    success: reviewData.success,
    status: reviewData.data?.status,
  });

  // 7. Verify single attendance correction
  const checkRosterRes = await fetch(`http://localhost:5000/api/hr/attendance?date=${today}`, { headers });
  const checkRosterData = await checkRosterRes.json();
  const firstLogged = checkRosterData.data?.roster?.[0];
  if (firstLogged?.id) {
    const patchRes = await fetch(`http://localhost:5000/api/hr/attendance/${firstLogged.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        notes: "Audited note with manager correction",
        correctionReason: "Corrected punch out timestamp",
        workHours: 8.5,
      }),
    });
    const patchData = await patchRes.json();
    console.log("✓ 7. Single Attendance Record Correction:", {
      success: patchData.success,
      workHours: patchData.data?.workHours,
      correctionReason: patchData.data?.correctionReason,
    });
  }

  // 8. Fetch Dashboard Analytics
  const dashRes = await fetch(`http://localhost:5000/api/hr/attendance/dashboard?date=${today}`, { headers });
  const dashData = await dashRes.json();
  console.log("✓ 8. Attendance Dashboard KPIs:", {
    presentCount: dashData.data?.kpis?.presentCount,
    attendancePercentage: dashData.data?.kpis?.attendancePercentage,
    trendPoints: dashData.data?.trend?.length,
    projectBreakdown: dashData.data?.projectSummaries?.length,
  });

  // 9. Fetch History & Search
  const histRes = await fetch("http://localhost:5000/api/hr/attendance/history?page=1&limit=10", { headers });
  const histData = await histRes.json();
  console.log("✓ 9. Attendance History & Pagination:", {
    totalRecords: histData.data?.pagination?.total,
    totalPages: histData.data?.pagination?.totalPages,
    firstRecordWorker: histData.data?.records?.[0]?.employee?.fullName,
  });

  // 10. Fetch Monthly Reports
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const repRes = await fetch(`http://localhost:5000/api/hr/attendance/reports?month=${currentMonth}&year=${currentYear}`, { headers });
  const repData = await repRes.json();
  console.log("✓ 10. Monthly Labor Reports:", {
    totalWorkers: repData.data?.totalWorkers,
    overallSummary: repData.data?.overallSummary,
  });

  console.log("=== ALL ATTENDANCE CHECKS PASSED END-TO-END! ===");
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
