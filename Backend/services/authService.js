import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  generateResetToken,
  normalizeEmail,
} from "../utils/auth.js";
import prisma from "../config/prisma.js";

export const authService = {
  async login(email, password, userAgent, ipAddress) {
    try {
      const normalizedEmail = normalizeEmail(email);

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          fullName: true,
          email: true,
          passwordHash: true,
          role: {
            select: {
              name: true,
            },
          },
          isActive: true,
        },
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      if (!user.isActive) {
        throw new Error("Account is inactive");
      }

      if (!user.passwordHash) {
        throw new Error("Invalid credentials");
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);

      if (!isValidPassword) {
        throw new Error("Invalid credentials");
      }

      if (!user.role || !user.role.name) {
        throw new Error("User has no assigned role");
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role.name,
      });

      const refreshToken = generateRefreshToken();
      const refreshTokenHash = hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash: refreshTokenHash,
          expiresAt,
          userAgent,
          ipAddress,
        },
      });

      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role.name,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      // Re-throw expected errors with their original messages without logging as unexpected system crashes
      if (
        error.message === "Invalid credentials" ||
        error.message === "Account is inactive" ||
        error.message === "User has no assigned role"
      ) {
        throw error;
      }
      // Wrap unexpected errors
      console.error("Login service unexpected error:", error);
      throw new Error("Unable to process login request");
    }
  },

  async refresh(refreshToken, userAgent, ipAddress) {
    const refreshTokenHash = hashToken(refreshToken);

    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash: refreshTokenHash },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            isActive: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error("Invalid refresh token");
    }

    if (session.revokedAt) {
      throw new Error("Refresh token has been revoked");
    }

    if (session.expiresAt < new Date()) {
      throw new Error("Refresh token has expired");
    }

    if (!session.user.isActive) {
      throw new Error("Account is inactive");
    }

    const accessToken = generateAccessToken({
      userId: session.user.id,
      role: session.user.role.name,
    });

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshSession.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          replacedBySessionId: newRefreshTokenHash,
        },
      }),
      prisma.refreshSession.create({
        data: {
          userId: session.user.id,
          tokenHash: newRefreshTokenHash,
          expiresAt,
          userAgent,
          ipAddress,
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(refreshToken) {
    const refreshTokenHash = hashToken(refreshToken);

    await prisma.refreshSession.updateMany({
      where: { tokenHash: refreshTokenHash },
      data: { revokedAt: new Date() },
    });
  },

  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: {
          select: {
            name: true,
            description: true,
          },
        },
        isActive: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isActive) {
      throw new Error("Account is inactive");
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.name,
      roleDescription: user.role.description,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.refreshSession.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      }),
    ]);
  },

  async forgotPassword(email) {
    try {
      const normalizedEmail = normalizeEmail(email);

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new Error("Email is not registered");
      }

      if (!user.isActive) {
        throw new Error("Account is inactive");
      }

      const token = generateResetToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      return {
        success: true,
        message: "Password reset instructions have been sent to your email",
        token,
      };
    } catch (error) {
      if (error.message === "Email is not registered" || error.message === "Account is inactive") {
        throw error;
      }
      console.error("Forgot password service error:", error);
      throw new Error("Unable to process password reset request");
    }
  },

  async resetPassword(token, newPassword) {
    const tokenHash = hashToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new Error("Invalid reset token");
    }

    if (resetToken.usedAt) {
      throw new Error("Reset token has already been used");
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error("Reset token has expired");
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshSession.updateMany({
        where: { userId: resetToken.userId },
        data: { revokedAt: new Date() },
      }),
    ]);
  },

  async verifyEmail(token) {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { success: true };
  },

  async resendVerificationEmail(email) {
    try {
      const normalizedEmail = normalizeEmail(email);

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new Error("Email is not registered");
      }

      if (!user.isActive) {
        throw new Error("Account is inactive");
      }

      if (user.emailVerifiedAt) {
        throw new Error("Email already verified");
      }

      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: token,
          emailVerificationExpiresAt: expiresAt,
        },
      });

      return {
        success: true,
        message: "A verification link has been sent to your email",
        token,
      };
    } catch (error) {
      if (
        error.message === "Email is not registered" ||
        error.message === "Email already verified" ||
        error.message === "Account is inactive"
      ) {
        throw error;
      }
      console.error("Resend verification email service error:", error);
      throw new Error("Unable to send verification email");
    }
  },
};
