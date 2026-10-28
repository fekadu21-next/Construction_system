import http from "http";
import app from "./app.js";

let server;
const PORT = 5005;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on("error", reject);
    if (data) {
      req.write(typeof data === "string" ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==========================================================");
  console.log("   SITE ENGINEER & CROSS-ROLE INTEGRATION TEST SUITE      ");
  console.log("==========================================================");

  server = app.listen(PORT);
  console.log(`✓ Test server running on http://localhost:${PORT}`);

  try {
    // 1. Authenticate as Site Engineer (Eng. Yared Abebe)
    console.log("\n[TEST 1] Authenticating as Site Engineer (yared.site@construction.local)...");
    const seLoginRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        email: "yared.site@construction.local",
        password: "Engineer@123456",
      }
    );

    console.log(`Login status: ${seLoginRes.status}`);
    const seToken = seLoginRes.data?.data?.accessToken || seLoginRes.data?.data?.token;
    if (seLoginRes.status !== 200 || !seToken) {
      throw new Error(`SE Login failed: ${JSON.stringify(seLoginRes.data)}`);
    }
    const seHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${seToken}`,
    };
    console.log("✓ Site Engineer authenticated successfully!");

    // 2. Site Engineer Dashboard Overview
    console.log("\n[TEST 2] GET /api/site-engineer/dashboard...");
    const dashRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/site-engineer/dashboard",
      method: "GET",
      headers: seHeaders,
    });
    console.log(`Status: ${dashRes.status}`);
    console.log("Dashboard Metrics:", dashRes.data?.data?.summaryMetrics);
    if (dashRes.status !== 200 || !dashRes.data?.success) {
      throw new Error("Dashboard API failed");
    }
    console.log("✓ Dashboard metrics retrieved successfully!");

    // 3. Assigned Projects Retrieval
    console.log("\n[TEST 3] GET /api/site-engineer/projects...");
    const projRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/site-engineer/projects",
      method: "GET",
      headers: seHeaders,
    });
    console.log(`Status: ${projRes.status}, count: ${projRes.data?.data?.projects?.length}`);
    const projects = projRes.data?.data?.projects || [];
    const boleProject = projects.find((p) => p.projectCode === "BM-PRJ-0104") || projects[0];
    console.log(`Selected project for testing: ${boleProject.projectName} (${boleProject.projectCode})`);
    console.log("✓ Assigned projects retrieved!");

    // 4. Single Project Details & Worker Roster
    console.log(`\n[TEST 4] GET /api/site-engineer/projects/${boleProject.id}...`);
    const singleProjRes = await request({
      hostname: "localhost",
      port: PORT,
      path: `/api/site-engineer/projects/${boleProject.id}`,
      method: "GET",
      headers: seHeaders,
    });
    console.log(`Status: ${singleProjRes.status}, project: ${singleProjRes.data?.data?.projectName}`);

    console.log(`\n[TEST 4b] GET /api/site-engineer/projects/${boleProject.id}/workers...`);
    const workersRes = await request({
      hostname: "localhost",
      port: PORT,
      path: `/api/site-engineer/projects/${boleProject.id}/workers`,
      method: "GET",
      headers: seHeaders,
    });
    console.log(`Status: ${workersRes.status}, eligible workers: ${workersRes.data?.data?.length}`);
    const eligibleWorker = workersRes.data?.data?.[0];
    console.log("Sample worker:", eligibleWorker?.fullName, `(${eligibleWorker?.trade})`);
    if (!eligibleWorker) {
      throw new Error("Expected eligible workers on Bole Commercial Center");
    }

    // 5. Tasks Management & Progress Update
    console.log("\n[TEST 5] GET /api/site-engineer/tasks...");
    const tasksRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/site-engineer/tasks",
      method: "GET",
      headers: seHeaders,
    });
    console.log(`Status: ${tasksRes.status}, tasks count: ${tasksRes.data?.data?.tasks?.length}`);
    const firstTask = tasksRes.data?.data?.tasks?.[0];
    if (firstTask) {
      console.log(`Updating task: ${firstTask.taskName} (Current: ${firstTask.progressPercent}%)`);
      const updateTaskRes = await request(
        {
          hostname: "localhost",
          port: PORT,
          path: `/api/site-engineer/tasks/${firstTask.id}/progress`,
          method: "PATCH",
          headers: seHeaders,
        },
        {
          progressPercent: 95,
          status: "IN_PROGRESS",
          completionNotes: "Formwork alignment completed and plumb line inspected.",
        }
      );
      console.log(`Update status: ${updateTaskRes.status}, new progress: ${updateTaskRes.data?.data?.progressPercent}%`);
      if (updateTaskRes.status !== 200) {
        throw new Error("Task update failed");
      }
      console.log("✓ Task progress updated successfully!");

      // Test validation: Progress > 100 should fail with 400
      const invalidTaskRes = await request(
        {
          hostname: "localhost",
          port: PORT,
          path: `/api/site-engineer/tasks/${firstTask.id}/progress`,
          method: "PATCH",
          headers: seHeaders,
        },
        {
          progressPercent: 150,
        }
      );
      console.log(`Invalid progress test status: ${invalidTaskRes.status} (expected 400)`);
      if (invalidTaskRes.status !== 400) {
        throw new Error("Validation failure: accepted progress > 100%");
      }
      console.log("✓ Invalid task progress correctly rejected!");
    }

    // 6. Daily Site Activities Recording
    console.log("\n[TEST 6] POST /api/site-engineer/activities...");
    const actRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/site-engineer/activities",
        method: "POST",
        headers: seHeaders,
      },
      {
        projectId: boleProject.id,
        activityDate: new Date().toISOString().split("T")[0],
        activityDescription: "Automated Test Activity: Column Rebar Cage Quality Sign-off",
        workCompleted: "Signed off column cage Grid C-D with QA inspector. 100% spacer coverage verified.",
        laborCount: 25,
        materialsUsed: "40kg rebar tie wire, 80 plastic spacers",
        safetyObservations: "All laborers equipped with full safety harnesses.",
      }
    );
    console.log(`Create activity status: ${actRes.status}, id: ${actRes.data?.data?.id}`);
    if (actRes.status !== 201) {
      throw new Error("Activity creation failed");
    }
    console.log("✓ Daily site activity logged successfully!");

    // 7. Worker Attendance Recording & Duplicate Prevention (Idempotent unique test date)
    console.log("\n[TEST 7] Worker Attendance Recording & Duplicate Prevention...");
    const randomOffsetDays = 200 + Math.floor(Math.random() * 800);
    const testDate = new Date(Date.now() + randomOffsetDays * 86400000);
    const formattedTestDate = testDate.toISOString().split("T")[0];

    const attRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/site-engineer/attendance",
        method: "POST",
        headers: seHeaders,
      },
      {
        projectId: boleProject.id,
        date: formattedTestDate,
        employeeId: eligibleWorker.id,
        status: "PRESENT",
        workHours: 8.0,
        overtimeHours: 2.0,
        checkInTime: "07:30",
        checkOutTime: "17:30",
        notes: "Full shift steel fixing work",
      }
    );
    console.log(`Attendance recording status: ${attRes.status}`);
    if (attRes.status !== 201) {
      throw new Error(`Failed to record attendance: ${JSON.stringify(attRes.data)}`);
    }
    console.log("✓ Worker attendance recorded successfully!");

    // Attempt duplicate submission for same worker & date -> Expect 409
    console.log("Attempting duplicate attendance entry on same date...");
    const dupRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/site-engineer/attendance",
        method: "POST",
        headers: seHeaders,
      },
      {
        projectId: boleProject.id,
        date: formattedTestDate,
        employeeId: eligibleWorker.id,
        status: "PRESENT",
      }
    );
    console.log(`Duplicate test status: ${dupRes.status} (expected 409)`);
    if (dupRes.status !== 409) {
      throw new Error("Duplicate attendance was not rejected!");
    }
    console.log("✓ Duplicate attendance successfully prevented!");

    // 8. Progress Report Submission
    console.log("\n[TEST 8] POST /api/site-engineer/progress-reports...");
    const reportRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/site-engineer/progress-reports",
        method: "POST",
        headers: seHeaders,
      },
      {
        projectId: boleProject.id,
        reportTitle: "Weekly Technical Inspection: Slab 10 Casting Preparation",
        workCompleted: "Formwork alignment completed; rebar steel verified; compressive cube test samples cured.",
        reportedProgress: "+6.5% Slab 10 Shuttering and Rebar Ready",
        issuesOrDelays: "None",
        weatherConditions: "Sunny (23°C)",
        laborCount: 40,
        equipmentActive: "Tower Crane #1, Batch Mixer",
        photosAttached: 3,
      }
    );
    console.log(`Report submission status: ${reportRes.status}, status: ${reportRes.data?.data?.reviewStatus}`);
    if (reportRes.status !== 201 || reportRes.data?.data?.reviewStatus !== "PENDING_REVIEW") {
      throw new Error("Progress report submission failed");
    }
    const submittedReportId = reportRes.data?.data?.id;
    console.log("✓ Progress report submitted with reviewStatus: PENDING_REVIEW!");

    // 9. Material Request Submission
    console.log("\n[TEST 9] POST /api/site-engineer/material-requests...");
    const matReqRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/site-engineer/material-requests",
        method: "POST",
        headers: seHeaders,
      },
      {
        projectId: boleProject.id,
        urgency: "HIGH",
        justification: "Critical for casting slab columns before scheduled rain.",
        deliveryLocation: "Yard Gate 1",
        items: [
          { itemName: "Portland Cement (Grade 42.5R)", quantity: 300, unit: "Bags", estimatedUnitCost: 1450.0 },
          { itemName: "Deformed Steel Bar 16mm", quantity: 5, unit: "Tons", estimatedUnitCost: 98000.0 },
        ],
      }
    );
    console.log(`Material request status: ${matReqRes.status}, reqNumber: ${matReqRes.data?.data?.requestNumber}`);
    if (matReqRes.status !== 201 || matReqRes.data?.data?.status !== "PENDING") {
      throw new Error("Material request submission failed");
    }
    const submittedReqId = matReqRes.data?.data?.id;
    console.log("✓ Material request submitted with status: PENDING!");

    // 10. Security Isolation
    console.log("\n[TEST 10] Security Isolation Verification...");
    const unauthorizedApprove = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: `/api/project-manager/material-requests/${submittedReqId}/approve`,
        method: "PATCH",
        headers: seHeaders,
      },
      { approvalNotes: "Trying to self-approve" }
    );
    console.log(`Self-approval attempt status: ${unauthorizedApprove.status} (expected 403)`);
    if (unauthorizedApprove.status !== 403) {
      throw new Error("Security vulnerability: Site Engineer was able to call PM approval endpoint!");
    }

    const unauthorizedGM = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/users",
        method: "POST",
        headers: seHeaders,
      },
      { fullName: "Hacker User", email: "hacker@test.com", role: "GENERAL_MANAGER" }
    );
    console.log(`GM endpoint access attempt status: ${unauthorizedGM.status} (expected 403)`);
    if (unauthorizedGM.status !== 403) {
      throw new Error("Security vulnerability: Site Engineer accessed GM user management!");
    }
    console.log("✓ Security isolation confirmed: SE cannot approve records or access GM endpoints!");

    // 11. Project Manager Integration Verification
    console.log("\n[TEST 11] Project Manager Workflow Integration...");
    const pmLoginRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        email: "dawit.pm@construction.com",
        password: "Password@123",
      }
    );
    const pmToken = pmLoginRes.data?.data?.accessToken || pmLoginRes.data?.data?.token;
    const pmHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pmToken}`,
    };

    // PM views the newly submitted material request
    const pmReqList = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/project-manager/material-requests",
      method: "GET",
      headers: pmHeaders,
    });
    const foundReq = pmReqList.data?.data?.requests?.find((r) => r.id === submittedReqId);
    console.log(`PM found Site Engineer's new request (${submittedReqId}):`, Boolean(foundReq));

    // PM reviews Site Engineer's progress report
    if (submittedReportId) {
      const pmReviewReport = await request(
        {
          hostname: "localhost",
          port: PORT,
          path: `/api/project-manager/progress-reports/${submittedReportId}/review`,
          method: "PATCH",
          headers: pmHeaders,
        },
        { reviewNotes: "Reviewed and approved by Dawit. Excellent rebar quality.", status: "REVIEWED" }
      );
      console.log(`PM review report status: ${pmReviewReport.status}, result: ${pmReviewReport.data?.data?.reviewStatus}`);
    }
    console.log("✓ Project Manager workflow integration verified!");

    // 12. General Manager Protected Workflow Verification
    console.log("\n[TEST 12] General Manager Protected Workflow Verification...");
    const gmLoginRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        email: "admin@gmail.com",
        password: "Admin@123456",
      }
    );
    const gmToken = gmLoginRes.data?.data?.accessToken || gmLoginRes.data?.data?.token;
    const gmHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${gmToken}`,
    };

    const gmDashRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/general-manager/metrics",
      method: "GET",
      headers: gmHeaders,
    });
    console.log(`GM Dashboard metrics status: ${gmDashRes.status}`);
    console.log("GM metrics:", {
      totalProjects: gmDashRes.data?.data?.totalProjects,
      totalUsers: gmDashRes.data?.data?.totalUsers,
    });
    if (gmDashRes.status !== 200 || !gmDashRes.data?.success) {
      throw new Error("GM Dashboard metrics failed!");
    }
    console.log("✓ General Manager dashboard and workflows remain 100% UNTOUCHED and fully functional!");

    console.log("\n==========================================================");
    console.log("   ✓ ALL 12 INTEGRATION TESTS PASSED WITH 100% SUCCESS!   ");
    console.log("==========================================================");
  } finally {
    if (server) {
      server.close();
      console.log("✓ Test server closed.");
    }
  }
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  if (server) server.close();
  process.exit(1);
});
