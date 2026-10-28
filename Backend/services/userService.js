import { hashPassword, normalizeEmail } from "../utils/auth.js";
import prisma from "../config/prisma.js";
import { WORKER_TRADE } from "../constants/hrConstants.js";

export const userService = {
  /**
   * List users with search, role/status filters, pagination, and sorting
   */
  async getUsers({
    page = 1,
    limit = 10,
    search = "",
    role = "",
    isActive = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  }) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;
    const where = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    if (role && role.trim()) {
      where.role = {
        OR: [
          { name: role.trim() },
          { id: role.trim() },
        ],
      };
    }

    if (isActive !== "" && isActive !== undefined && isActive !== null) {
      if (isActive === "true" || isActive === true) {
        where.isActive = true;
      } else if (isActive === "false" || isActive === false) {
        where.isActive = false;
      }
    }

    // Supported sort columns
    const allowedSortColumns = ["fullName", "email", "createdAt", "updatedAt", "isActive"];
    const sortField = allowedSortColumns.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder?.toLowerCase() === "asc" ? "asc" : "desc";

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDirection },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          isActive: true,
          emailVerifiedAt: true,
          profilePhotoUrl: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },

  /**
   * Return dynamic summary statistics for the User Management dashboard
   */
  async getUserSummary() {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const inactiveUsers = Math.max(0, totalUsers - activeUsers);

    const [roleBreakdown, roles] = await Promise.all([
      prisma.user.groupBy({
        by: ["roleId"],
        _count: { id: true },
      }),
      prisma.role.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const rolesCount = roles.length;

    const breakdown = roles.map((r) => {
      const found = roleBreakdown.find((b) => b.roleId === r.id);
      return {
        roleId: r.id,
        roleName: r.name,
        roleDescription: r.description,
        count: found ? found._count.id : 0,
      };
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      rolesCount: rolesCount || 7,
      breakdown,
    };
  },

  /**
   * Return all system roles
   */
  async getRoles() {
    return prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Retrieve a user's details including project references
   */
  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        isActive: true,
        emailVerifiedAt: true,
        mustChangePassword: true,
        profilePhotoUrl: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        managedProjects: {
          select: {
            id: true,
            projectName: true,
            projectCode: true,
            status: true,
            startDate: true,
            endDate: true,
            budget: true,
          },
          orderBy: { createdAt: "desc" },
        },
        createdProjects: {
          select: {
            id: true,
            projectName: true,
            projectCode: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },

  /**
   * Create a new user account with role assignment
   */
  async createUser(data, actorId) {
    const normalizedEmail = normalizeEmail(data.email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Resolve role by id or role name (with SUPERVISER alias support)
    let role = null;
    const resolvedRoleId = data.roleId === "SUPERVISER" ? "SUPERVISOR" : data.roleId;
    const resolvedRoleName = data.role === "SUPERVISER" ? "SUPERVISOR" : data.role;
    if (resolvedRoleId) {
      role = await prisma.role.findFirst({
        where: {
          OR: [{ id: resolvedRoleId }, { name: resolvedRoleId }],
        },
      });
    } else if (resolvedRoleName) {
      role = await prisma.role.findUnique({
        where: { name: resolvedRoleName },
      });
    }

    if (!role) {
      throw new Error("Invalid system role selected");
    }

    // Password handling
    const initialPassword = data.password && data.password.trim() ? data.password.trim() : "Welcome@123456";
    const passwordHash = await hashPassword(initialPassword);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName.trim(),
        email: normalizedEmail,
        phone: data.phone && data.phone.trim() ? data.phone.trim() : null,
        passwordHash,
        roleId: role.id,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        mustChangePassword: data.mustChangePassword !== undefined ? Boolean(data.mustChangePassword) : false,
        emailVerifiedAt: new Date(), // Auto-verified on admin creation
        createdById: actorId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        isActive: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    // Record in Audit Log
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "USER_CREATED",
        entityType: "User",
        entityId: user.id,
        details: {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role.name,
          isActive: user.isActive,
        },
      },
    });

    // Auto-sync into employee table since all company users are employees
    try {
      const normalizedUserEmail = user.email.toLowerCase().trim();
      const existingEmployee = await prisma.employee.findFirst({
        where: { email: { equals: normalizedUserEmail, mode: "insensitive" } },
      });

      if (!existingEmployee) {
        const employees = await prisma.employee.findMany({ select: { employeeCode: true } });
        let maxNum = 0;
        employees.forEach((emp) => {
          const match = emp.employeeCode?.match(/^EMP-(\d+)$/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        const employeeCode = `EMP-${String(maxNum + 1).padStart(4, "0")}`;
        const userRole = user.role?.name || "SITE_LABORER";
        const trade = WORKER_TRADE[userRole] ? userRole : "SITE_LABORER";

        await prisma.employee.create({
          data: {
            employeeCode,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone?.trim() || "+251900000000",
            trade,
            employmentType: "FULL_TIME",
            status: user.isActive ? "ACTIVE" : "INACTIVE",
            hireDate: new Date(),
            workTeam: "Executive & Staff",
            currency: "ETB",
          },
        });
      }
    } catch (empSyncErr) {
      console.warn("Auto-syncing new user to employee table warning:", empSyncErr.message);
    }

    return user;
  },

  /**
   * Update an existing user's details and role
   */
  async updateUser(id, data, actorId) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updateData = {};
    const auditChanges = {};

    if (data.fullName !== undefined && data.fullName.trim()) {
      updateData.fullName = data.fullName.trim();
      auditChanges.fullName = { from: user.fullName, to: updateData.fullName };
    }

    if (data.email !== undefined && data.email.trim()) {
      const normalizedEmail = normalizeEmail(data.email);
      if (normalizedEmail !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (existingUser && existingUser.id !== id) {
          throw new Error("Email already exists");
        }
        updateData.email = normalizedEmail;
        auditChanges.email = { from: user.email, to: normalizedEmail };
      }
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone && data.phone.trim() ? data.phone.trim() : null;
      auditChanges.phone = { from: user.phone, to: updateData.phone };
    }

    // Role update safeguard: Cannot demote the last active General Manager
    if (data.roleId || data.role) {
      const rawIdentifier = data.roleId || data.role;
      const targetRoleIdentifier = rawIdentifier === "SUPERVISER" ? "SUPERVISOR" : rawIdentifier;
      const targetRole = await prisma.role.findFirst({
        where: {
          OR: [{ id: targetRoleIdentifier }, { name: targetRoleIdentifier }],
        },
      });

      if (!targetRole) {
        throw new Error("Invalid system role selected");
      }

      if (user.role.name === "GENERAL_MANAGER" && targetRole.name !== "GENERAL_MANAGER") {
        const activeGeneralManagers = await prisma.user.count({
          where: {
            role: { name: "GENERAL_MANAGER" },
            isActive: true,
            id: { not: id },
          },
        });

        if (activeGeneralManagers === 0) {
          throw new Error("Cannot change role of the last active General Manager");
        }
      }

      if (targetRole.id !== user.roleId) {
        updateData.roleId = targetRole.id;
        auditChanges.role = { from: user.role.name, to: targetRole.name };

        // Revoke active sessions so subsequent requests require re-authenticating / refreshed tokens
        await prisma.refreshSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    }

    // Active status change safeguard: Cannot deactivate last active General Manager
    if (data.isActive !== undefined) {
      const newStatus = Boolean(data.isActive);
      if (!newStatus && user.isActive && user.role.name === "GENERAL_MANAGER") {
        const activeGeneralManagers = await prisma.user.count({
          where: {
            role: { name: "GENERAL_MANAGER" },
            isActive: true,
            id: { not: id },
          },
        });

        if (activeGeneralManagers === 0) {
          throw new Error("Cannot deactivate the last active General Manager");
        }
      }

      if (newStatus !== user.isActive) {
        updateData.isActive = newStatus;
        auditChanges.isActive = { from: user.isActive, to: newStatus };

        if (!newStatus) {
          // Invalidate active refresh sessions
          await prisma.refreshSession.updateMany({
            where: { userId: id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
      }
    }

    if (data.password && data.password.trim()) {
      updateData.passwordHash = await hashPassword(data.password.trim());
      auditChanges.password = "Changed";
      // Revoke sessions on password reset
      await prisma.refreshSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        isActive: true,
        emailVerifiedAt: true,
        mustChangePassword: true,
        profilePhotoUrl: true,
        updatedAt: true,
      },
    });

    if (Object.keys(auditChanges).length > 0) {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "USER_UPDATED",
          entityType: "User",
          entityId: id,
          details: {
            changes: auditChanges,
          },
        },
      });
    }

    // Sync updated info with employee record if user is registered in workforce
    try {
      if (user.email && (updateData.fullName || updateData.phone || updateData.isActive !== undefined)) {
        await prisma.employee.updateMany({
          where: { email: { equals: user.email, mode: "insensitive" } },
          data: {
            ...(updateData.fullName ? { fullName: updateData.fullName } : {}),
            ...(updateData.phone ? { phone: updateData.phone } : {}),
            ...(updateData.isActive !== undefined ? { status: updateData.isActive ? "ACTIVE" : "INACTIVE" } : {}),
          },
        });
      }
    } catch (syncErr) {
      console.warn("User update employee sync warning:", syncErr.message);
    }

    return updatedUser;
  },

  /**
   * Activate or deactivate a user account with session invalidation
   */
  async updateUserStatus(id, isActive, actorId) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        managedProjects: {
          where: {
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
          select: { id: true, projectName: true },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const boolStatus = Boolean(isActive);

    // Prevent deactivating the last active General Manager
    if (!boolStatus && user.role.name === "GENERAL_MANAGER") {
      const activeGeneralManagers = await prisma.user.count({
        where: {
          role: { name: "GENERAL_MANAGER" },
          isActive: true,
          id: { not: id },
        },
      });

      if (activeGeneralManagers === 0) {
        throw new Error("Cannot deactivate the last active General Manager");
      }
    }

    // Invalidate sessions if deactivating
    if (!boolStatus) {
      await prisma.refreshSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: boolStatus },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: boolStatus ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entityType: "User",
        entityId: id,
        details: {
          fullName: user.fullName,
          email: user.email,
          previousStatus: user.isActive,
          newStatus: boolStatus,
        },
      },
    });

    // Provide warning if user is PM of active projects
    const activeProjectCount = user.managedProjects?.length || 0;
    const warning =
      !boolStatus && activeProjectCount > 0
        ? `This user is currently assigned as Project Manager to ${activeProjectCount} active project(s). Please reassign them in the Projects module.`
        : null;

    return {
      user: updatedUser,
      warning,
      activeProjectsAffected: activeProjectCount,
    };
  },

  /**
   * Permanently delete a user if retention rules permit
   */
  async deleteUser(id, actorId) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Prevent deleting the last active General Manager
    if (user.role.name === "GENERAL_MANAGER" && user.isActive) {
      const activeGeneralManagers = await prisma.user.count({
        where: {
          role: { name: "GENERAL_MANAGER" },
          isActive: true,
          id: { not: id },
        },
      });

      if (activeGeneralManagers === 0) {
        throw new Error("Cannot delete the last active General Manager");
      }
    }

    // Check for foreign key references in projects
    const projectCount = await prisma.project.count({
      where: {
        OR: [{ projectManagerId: id }, { createdById: id }],
      },
    });

    if (projectCount > 0) {
      throw new Error("Cannot delete user with associated projects. Deactivate the account instead.");
    }

    // Check if created other users
    const createdUsersCount = await prisma.user.count({
      where: { createdById: id },
    });

    if (createdUsersCount > 0) {
      // Disconnect creator reference instead of breaking foreign keys
      await prisma.user.updateMany({
        where: { createdById: id },
        data: { createdById: actorId },
      });
    }

    // Log deletion before removing record
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "USER_DELETED",
        entityType: "User",
        entityId: id,
        details: {
          fullName: user.fullName,
          email: user.email,
          role: user.role.name,
        },
      },
    });

    // Cleanup sessions & tokens
    await prisma.refreshSession.deleteMany({ where: { userId: id } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: id } });

    await prisma.user.delete({
      where: { id },
    });

    return { success: true };
  },

  /**
   * Return active eligible Project Managers for project assignments
   */
  async getProjectManagers() {
    const projectManagers = await prisma.user.findMany({
      where: {
        role: { name: "PROJECT_MANAGER" },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profilePhotoUrl: true,
        role: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return projectManagers;
  },
};
