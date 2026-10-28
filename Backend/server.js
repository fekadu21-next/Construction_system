import { env } from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";

async function startServer() {
  try {
    // Verify database connectivity first.
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log("------------------------------------");
      console.log("Backend started successfully!");
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Server: http://localhost:${env.PORT}`);
      console.log(`Health: http://localhost:${env.PORT}/api/health`);
      console.log(`Database: http://localhost:${env.PORT}/api/db-test`);
      console.log("------------------------------------");
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exitCode = 1;
  }
}

startServer();
// Active server
