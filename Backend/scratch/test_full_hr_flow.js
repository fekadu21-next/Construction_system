

async function runComprehensiveHRTest() {
  console.log("=== STARTING COMPREHENSIVE HR MODULE TEST ===");

  // 1. Login
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
  if (!token) throw new Error("Login failed: " + JSON.stringify(loginData));
  console.log("1. Authenticated as Admin. Token acquired.");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // 2. HR Metrics
  const metricsRes = await fetch("http://localhost:5000/api/hr/metrics", { headers });
  const metrics = await metricsRes.json();
  console.log("2. GET /api/hr/metrics:", metrics.success ? "SUCCESS" : metrics);

  // 3. Next Employee Code
  const nextCodeRes = await fetch("http://localhost:5000/api/hr/next-code", { headers });
  const nextCode = await nextCodeRes.json();
  console.log("3. GET /api/hr/next-code:", nextCode.data?.nextCode);

  // 4. Projects list
  const projectsRes = await fetch("http://localhost:5000/api/hr/projects", { headers });
  const projects = await projectsRes.json();
  console.log("4. GET /api/hr/projects count:", projects.data?.projects?.length);
  const sampleProjectId = projects.data?.projects?.[0]?.id || null;

  // 5. Create Employee 1
  const emp1Res = await fetch("http://localhost:5000/api/hr/employees", {
    method: "POST",
    headers,
    body: JSON.stringify({
      fullName: "Abebe Kebede",
      phone: "+251911223344",
      trade: "CARPENTER",
      employmentType: "DAILY_LABORER",
      dailyRate: 650,
      assignedProjectId: sampleProjectId,
      status: "ACTIVE",
    }),
  });
  const emp1 = await emp1Res.json();
  console.log("5. POST /api/hr/employees (Emp 1):", emp1.success ? `SUCCESS (ID: ${emp1.data?.id})` : emp1);
  const emp1Id = emp1.data?.id;

  // 6. Create Employee 2
  const emp2Res = await fetch("http://localhost:5000/api/hr/employees", {
    method: "POST",
    headers,
    body: JSON.stringify({
      fullName: "Tigist Haile",
      phone: "+251922334455",
      trade: "SITE_ENGINEER",
      employmentType: "CONTRACT",
      monthlySalary: 25000,
      assignedProjectId: sampleProjectId,
      status: "ACTIVE",
    }),
  });
  const emp2 = await emp2Res.json();
  console.log("6. POST /api/hr/employees (Emp 2):", emp2.success ? `SUCCESS (ID: ${emp2.data?.id})` : emp2);
  const emp2Id = emp2.data?.id;

  // 7. Get Employees list
  const empListRes = await fetch("http://localhost:5000/api/hr/employees?page=1&limit=10", { headers });
  const empList = await empListRes.json();
  console.log("7. GET /api/hr/employees total count:", empList.data?.pagination?.total);

  // 8. Update Employee
  if (emp1Id) {
    const updateRes = await fetch(`http://localhost:5000/api/hr/employees/${emp1Id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        dailyRate: 700,
      }),
    });
    const updateData = await updateRes.json();
    console.log("8. PATCH /api/hr/employees/:id:", updateData.success ? "SUCCESS" : updateData);
  }

  // 9. Get Daily Attendance
  const todayStr = new Date().toISOString().split("T")[0];
  const attRes = await fetch(`http://localhost:5000/api/hr/attendance?date=${todayStr}`, { headers });
  const attData = await attRes.json();
  console.log("9. GET /api/hr/attendance count:", attData.data?.roster?.length);

  // 10. Record Attendance
  if (emp1Id && emp2Id) {
    const recordRes = await fetch("http://localhost:5000/api/hr/attendance", {
      method: "POST",
      headers,
      body: JSON.stringify({
        date: todayStr,
        projectId: sampleProjectId,
        records: [
          { employeeId: emp1Id, status: "PRESENT", overtimeHours: 2, notes: "Good job" },
          { employeeId: emp2Id, status: "PRESENT", overtimeHours: 0, notes: "On site" },
        ],
      }),
    });
    const recordData = await recordRes.json();
    console.log("10. POST /api/hr/attendance:", recordData.success ? `SUCCESS (${recordData.data?.count} saved)` : recordData);
  }

  // 11. Submit Leave Request
  let leaveId = null;
  if (emp1Id) {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const afterTomorrow = new Date(Date.now() + 172800000).toISOString().split("T")[0];
    const leaveRes = await fetch("http://localhost:5000/api/hr/leaves", {
      method: "POST",
      headers,
      body: JSON.stringify({
        employeeId: emp1Id,
        leaveType: "ANNUAL",
        startDate: tomorrow,
        endDate: afterTomorrow,
        reason: "Family matter",
      }),
    });
    const leaveData = await leaveRes.json();
    leaveId = leaveData.data?.id;
    console.log("11. POST /api/hr/leaves:", leaveData.success ? `SUCCESS (Leave ID: ${leaveId})` : leaveData);
  }

  // 12. Review Leave Request
  if (leaveId) {
    const reviewRes = await fetch(`http://localhost:5000/api/hr/leaves/${leaveId}/review`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        status: "APPROVED",
        reviewerNote: "Approved by GM",
      }),
    });
    const reviewData = await reviewRes.json();
    console.log("12. PATCH /api/hr/leaves/:id/review:", reviewData.success ? "SUCCESS" : reviewData);
  }

  // 13. Payroll sheet
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const payrollRes = await fetch(`http://localhost:5000/api/hr/payroll?month=${currentMonth}&year=${currentYear}`, { headers });
  const payrollData = await payrollRes.json();
  console.log("13. GET /api/hr/payroll total payout:", payrollData.data?.totalGrossPayout, payrollData.data?.currency);

  // 14. Notifications
  const notifRes = await fetch("http://localhost:5000/api/notifications?limit=5", { headers });
  const notifData = await notifRes.json();
  console.log("14. GET /api/notifications total unread:", notifData.data?.unreadCount);

  console.log("=== ALL HR MODULE TESTS COMPLETED SUCCESSFULLY ===");
}

runComprehensiveHRTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
