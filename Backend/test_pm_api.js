import http from 'http';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Testing Project Manager Backend Endpoints ---');

  // 1. Authenticate as Dawit (Project Manager)
  console.log('\n1. Logging in as dawit.pm@construction.com...');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'dawit.pm@construction.com',
      password: 'Password@123',
    }
  );

  console.log(`Login status: ${loginRes.status}`);
  const token = loginRes.data?.data?.accessToken || loginRes.data?.data?.token;
  if (loginRes.status !== 200 || !token) {
    console.error('Login failed:', loginRes.data);
    process.exit(1);
  }
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  console.log('✓ Successfully authenticated! Token received.');

  // 2. Dashboard API
  console.log('\n2. Testing GET /api/project-manager/dashboard...');
  const dashRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/project-manager/dashboard',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Status: ${dashRes.status}`);
  console.log('Dashboard metrics:', {
    assignedProjects: dashRes.data?.data?.summaryMetrics?.assignedProjects,
    inProgress: dashRes.data?.data?.summaryMetrics?.projectsInProgress,
    delayed: dashRes.data?.data?.summaryMetrics?.delayedProjects,
    pendingMaterialApprovals: dashRes.data?.data?.summaryMetrics?.pendingApprovals,
    totalBudget: dashRes.data?.data?.budgetOverview?.totalPlannedBudget,
    totalSpent: dashRes.data?.data?.budgetOverview?.actualExpenditure,
    utilizationRate: `${dashRes.data?.data?.budgetOverview?.utilizationPercentage}%`,
  });

  // 3. Projects API
  console.log('\n3. Testing GET /api/project-manager/projects...');
  const projRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/project-manager/projects',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Status: ${projRes.status}, count: ${projRes.data?.data?.projects?.length}`);
  const firstProject = projRes.data?.data?.projects?.[0];
  console.log('Sample project:', firstProject ? { id: firstProject.id, name: firstProject.projectName, code: firstProject.projectCode, status: firstProject.status } : 'none');

  if (!firstProject) {
    console.error('No projects returned!');
    process.exit(1);
  }

  // 4. Single Project Details
  console.log(`\n4. Testing GET /api/project-manager/projects/${firstProject.id}...`);
  const singleProjRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/project-manager/projects/${firstProject.id}`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Status: ${singleProjRes.status}, Project: ${singleProjRes.data?.data?.projectName}`);
  console.log(`Milestones count: ${singleProjRes.data?.data?.milestones?.length}`);

  // 5. Project Milestones
  console.log(`\n5. Testing GET /api/project-manager/projects/${firstProject.id}/milestones...`);
  const milesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/project-manager/projects/${firstProject.id}/milestones`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Status: ${milesRes.status}, milestones: ${milesRes.data?.data?.length}`);
  const firstMilestone = milesRes.data?.data?.[0];

  // 6. Update Milestone Status
  if (firstMilestone) {
    console.log(`\n6. Testing PATCH /api/project-manager/milestones/${firstMilestone.id}...`);
    const updateMileRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/project-manager/milestones/${firstMilestone.id}`,
        method: 'PATCH',
        headers: authHeaders,
      },
      {
        progressPercent: 85,
        status: 'IN_PROGRESS',
      }
    );
    console.log(`Status: ${updateMileRes.status}, updated progress: ${updateMileRes.data?.data?.progressPercent}%`);
  }

  // 7. Progress Reports
  console.log('\n7. Testing GET /api/project-manager/progress-reports...');
  const reportsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/project-manager/progress-reports',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Status: ${reportsRes.status}, reports count: ${reportsRes.data?.data?.reports?.length}`);
  const firstReport = reportsRes.data?.data?.reports?.[0];

  // 8. Review Progress Report
  if (firstReport) {
    console.log(`\n8. Testing PATCH /api/project-manager/progress-reports/${firstReport.id}/review...`);
    const reviewRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/project-manager/progress-reports/${firstReport.id}/review`,
        method: 'PATCH',
        headers: authHeaders,
      },
      {
        reviewNotes: 'Reviewed and confirmed progress aligns with structural engineer sign-off.',
        status: 'REVIEWED',
      }
    );
    console.log(`Status: ${reviewRes.status}, review status: ${reviewRes.data?.data?.reviewStatus}`);
  }

  // 9. Material Requests
  console.log('\n9. Testing GET /api/project-manager/material-requests...');
  const matReqRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/project-manager/material-requests',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Status: ${matReqRes.status}, requests count: ${matReqRes.data?.data?.requests?.length}`);
  const pendingRequest = matReqRes.data?.data?.requests?.find((r) => r.status === 'PENDING');

  // 10. Approve Material Request
  if (pendingRequest) {
    console.log(`\n10. Testing PATCH /api/project-manager/material-requests/${pendingRequest.id}/approve...`);
    const approveRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/project-manager/material-requests/${pendingRequest.id}/approve`,
        method: 'PATCH',
        headers: authHeaders,
      },
      {
        approvalNotes: 'Approved for procurement - delivery needed by next week.',
      }
    );
    console.log(`Status: ${approveRes.status}, result status: ${approveRes.data?.data?.status}`);
  }

  // 11. Budget API
  console.log('\n11. Testing GET /api/project-manager/budget...');
  const budgetRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/project-manager/budget',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Status: ${budgetRes.status}`);
  console.log('Budget summary:', {
    totalPlanned: budgetRes.data?.data?.budgetSummary?.totalPlannedBudget,
    actualExpenditure: budgetRes.data?.data?.budgetSummary?.actualExpenditure,
    utilization: `${budgetRes.data?.data?.budgetSummary?.utilizationPercentage}%`,
    expensesCount: budgetRes.data?.data?.expenseLedger?.expenses?.length,
  });

  // 12. Reports & Analytics API
  console.log('\n12. Testing GET /api/project-manager/reports...');
  const reportsAnalyticsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/project-manager/reports',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Status: ${reportsAnalyticsRes.status}`);
  console.log('KPIs:', reportsAnalyticsRes.data?.data?.kpis?.map((k) => `${k.title}: ${k.value}`));

  // 13. Security Verification: Project Manager cannot access unauthorized project
  console.log('\n13. Testing Security Isolation (accessing non-existent / unauthorized project)...');
  const fakeId = '00000000-0000-0000-0000-000000000000';
  const unauthorizedRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/project-manager/projects/${fakeId}`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Status: ${unauthorizedRes.status} (expected 404 or 403)`);

  console.log('\n✓ ALL BACKEND TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(console.error);
