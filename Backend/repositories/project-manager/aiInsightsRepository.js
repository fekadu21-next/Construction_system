import prisma from "../../config/prisma.js";

export const pmAiInsightsRepository = {
  /**
   * Compute empirical delay predictions, cost forecasts, and actionable recommendations
   * based on authentic project records.
   */
  async getAiInsights(managerId, { projectId } = {}) {
    // 1. Get projects assigned to manager
    const pmProjects = await prisma.project.findMany({
      where: {
        ...(managerId ? { projectManagerId: managerId } : {}),
        archivedAt: null,
      },
      select: {
        id: true,
        projectName: true,
        projectCode: true,
        startDate: true,
        endDate: true,
        budget: true,
        status: true,
        currency: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const allowedProjectIds = pmProjects.map((p) => p.id);
    if (allowedProjectIds.length === 0) {
      return {
        insights: [],
        summary: {
          analyzedProjects: 0,
          highRiskCount: 0,
          moderateRiskCount: 0,
          onTrackCount: 0,
          averageConfidence: 0,
        },
        projects: [],
      };
    }

    const targetProjectIds = projectId ? [projectId] : allowedProjectIds;
    const now = new Date();

    const insights = [];
    let highRiskCount = 0;
    let moderateRiskCount = 0;
    let onTrackCount = 0;

    for (const proj of pmProjects) {
      if (!targetProjectIds.includes(proj.id)) continue;

      // Fetch project operational data
      const [tasks, activities, reports, expenses, pendingReqs] = await Promise.all([
        prisma.task.findMany({
          where: { projectId: proj.id },
          select: {
            id: true,
            taskName: true,
            status: true,
            priority: true,
            progressPercent: true,
            dueDate: true,
            issues: true,
          },
        }),
        prisma.dailySiteActivity.findMany({
          where: { projectId: proj.id },
          orderBy: { activityDate: "desc" },
          take: 10,
          select: {
            id: true,
            activityDate: true,
            workCompleted: true,
            issues: true,
            materialsUsed: true,
          },
        }),
        prisma.progressReport.findMany({
          where: { projectId: proj.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            reportTitle: true,
            reportedProgress: true,
            issuesOrDelays: true,
            reviewStatus: true,
          },
        }),
        prisma.projectExpense.findMany({
          where: { projectId: proj.id },
          select: { id: true, amount: true, expenseCategory: true },
        }),
        prisma.materialRequest.count({
          where: { projectId: proj.id, status: "PENDING" },
        }),
      ]);

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
      const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
      const overdueTasks = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED"
      );

      const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const plannedBudget = Number(proj.budget || 0);

      // Data Sufficiency Check: Need at least 2 tasks and 2 site activity/report records
      const totalFieldLogs = activities.length + reports.length;
      const hasSufficientData = totalTasks >= 2 && totalFieldLogs >= 2;

      if (!hasSufficientData) {
        insights.push({
          projectId: proj.id,
          projectName: proj.projectName,
          projectCode: proj.projectCode,
          hasSufficientData: false,
          insufficientReason:
            totalTasks < 2
              ? "Insufficient tasks defined (minimum 2 tasks required for progress velocity modeling)."
              : "Insufficient field logs submitted by Site Engineer (minimum 2 daily logs or reports required).",
          currentMetrics: {
            totalTasks,
            completedTasks,
            totalFieldLogs,
            totalSpent,
            plannedBudget,
            currency: proj.currency || "ETB",
          },
          delayPrediction: null,
          costForecast: null,
          recommendations: [
            {
              id: `rec-data-${proj.id}`,
              type: "DATA_COLLECTION",
              priority: "MEDIUM",
              title: "Collect Baseline Site Data",
              description: `Define project tasks and ensure the assigned Site Engineer submits daily site activities to activate AI delay and cost predictions.`,
            },
          ],
        });
        continue;
      }

      // 1. Calculate Actual Progress & Expected Progress
      const sumTaskProgress = tasks.reduce((sum, t) => sum + (t.progressPercent || 0), 0);
      const actualProgress = Math.round(sumTaskProgress / Math.max(1, totalTasks));

      const startDate = proj.startDate ? new Date(proj.startDate) : new Date();
      const endDate = proj.endDate ? new Date(proj.endDate) : new Date(startDate.getTime() + 180 * 24 * 3600 * 1000);
      const plannedDurationDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
      const daysElapsed = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
      const expectedProgress = Math.min(100, Math.max(1, Math.round((daysElapsed / plannedDurationDays) * 100)));

      // Schedule Performance Index (SPI)
      const spi = parseFloat((actualProgress / Math.max(1, expectedProgress)).toFixed(2));

      // Predicted Slippage Days
      let predictedSlippageDays = 0;
      let delayRisk = "LOW";

      if (spi < 0.8) {
        delayRisk = "HIGH";
        predictedSlippageDays = Math.max(5, Math.round(plannedDurationDays * (1 / Math.max(0.2, spi) - 1)));
        highRiskCount++;
      } else if (spi < 0.95) {
        delayRisk = "MODERATE";
        predictedSlippageDays = Math.max(2, Math.round(plannedDurationDays * (1 / spi - 1)));
        moderateRiskCount++;
      } else {
        delayRisk = "LOW";
        predictedSlippageDays = 0;
        onTrackCount++;
      }

      // Check site issues impact
      const siteIssuesCount = activities.filter((a) => a.issues && a.issues.trim().length > 0).length;

      // 2. Cost Forecast (CPI & EAC)
      const earnedValue = plannedBudget * (actualProgress / 100);
      const cpi = totalSpent > 0 ? parseFloat((earnedValue / totalSpent).toFixed(2)) : 1.0;

      let estimateAtCompletion = plannedBudget;
      if (cpi > 0) {
        estimateAtCompletion = Math.round(plannedBudget / cpi);
      }
      const varianceAtCompletion = plannedBudget - estimateAtCompletion; // negative = overrun
      const overrunPercentage =
        plannedBudget > 0 ? parseFloat((((estimateAtCompletion - plannedBudget) / plannedBudget) * 100).toFixed(1)) : 0;

      let costRisk = "LOW";
      if (overrunPercentage > 10) {
        costRisk = "HIGH";
      } else if (overrunPercentage > 3) {
        costRisk = "MODERATE";
      }

      // 3. Synthesize Actionable AI Recommendations
      const recommendations = [];

      if (blockedTasks.length > 0) {
        recommendations.push({
          id: `rec-block-${proj.id}`,
          type: "SCHEDULE",
          priority: "HIGH",
          title: `Resolve ${blockedTasks.length} Blocked Task${blockedTasks.length > 1 ? "s" : ""}`,
          description: `Tasks "${blockedTasks.slice(0, 2).map((t) => t.taskName).join('", "')}" are marked as BLOCKED on site. Coordinate with the Site Engineer to remove dependencies.`,
        });
      }

      if (delayRisk === "HIGH") {
        recommendations.push({
          id: `rec-delay-${proj.id}`,
          type: "SCHEDULE",
          priority: "HIGH",
          title: `Mitigate Projected ${predictedSlippageDays}-Day Schedule Slippage`,
          description: `Velocity index (SPI: ${spi}) is significantly below planned baseline. Allocate extra workforce to overdue tasks or fast-track parallel milestones.`,
        });
      }

      if (costRisk === "HIGH") {
        recommendations.push({
          id: `rec-cost-${proj.id}`,
          type: "BUDGET",
          priority: "HIGH",
          title: `Cost Overrun Alert (+${overrunPercentage}% projected)`,
          description: `CPI of ${cpi} indicates actual expenditure is outpacing progress delivery. Review high-expenditure line items and daily equipment rental costs.`,
        });
      }

      if (pendingReqs > 0) {
        recommendations.push({
          id: `rec-req-${proj.id}`,
          type: "MATERIALS",
          priority: "MEDIUM",
          title: `Process ${pendingReqs} Pending Material Request${pendingReqs > 1 ? "s" : ""}`,
          description: `Site engineer has open material requisitions waiting for PM approval. Unfulfilled materials may induce future critical path delays.`,
        });
      }

      if (recommendations.length === 0) {
        recommendations.push({
          id: `rec-ontrack-${proj.id}`,
          type: "GENERAL",
          priority: "LOW",
          title: "Maintain Execution Momentum",
          description: `Project schedule and expenditure are tracking cleanly against planned baselines (SPI: ${spi}, CPI: ${cpi}). Continue standard weekly reviews.`,
        });
      }

      // Confidence score based on sample size (activities + tasks)
      const confidence = Math.min(94, Math.max(70, 70 + Math.min(24, totalFieldLogs * 3)));

      insights.push({
        projectId: proj.id,
        projectName: proj.projectName,
        projectCode: proj.projectCode,
        hasSufficientData: true,
        insufficientReason: null,
        confidence,
        delayPrediction: {
          spi,
          actualProgress,
          expectedProgress,
          delayRisk,
          predictedSlippageDays,
          overdueTasksCount: overdueTasks.length,
          blockedTasksCount: blockedTasks.length,
          siteIssuesCount,
        },
        costForecast: {
          cpi,
          plannedBudget,
          actualSpent: totalSpent,
          earnedValue: Math.round(earnedValue),
          estimateAtCompletion,
          varianceAtCompletion,
          overrunPercentage,
          costRisk,
          currency: proj.currency || "ETB",
        },
        recommendations,
      });
    }

    return {
      insights,
      summary: {
        analyzedProjects: insights.length,
        highRiskCount,
        moderateRiskCount,
        onTrackCount,
        averageConfidence:
          insights.length > 0
            ? Math.round(
                insights.reduce((sum, i) => sum + (i.confidence || 0), 0) /
                  Math.max(1, insights.filter((i) => i.hasSufficientData).length)
              )
            : 0,
      },
      projects: pmProjects,
    };
  },
};
