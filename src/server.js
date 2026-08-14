"use strict";

const { createApp } = require("./app");

const port = Number.parseInt(process.env.PORT || "8080", 10);
const host = process.env.HOST || "0.0.0.0";
const app = createApp();

const server = app.listen(port, host, () => {
  console.log(JSON.stringify({
    message: "server_started",
    host,
    port,
    environment: process.env.APP_ENV || process.env.NODE_ENV || "development"
  }));
});

function shutdown(signal) {
  console.log(JSON.stringify({ message: "shutdown_started", signal }));

  const timer = setTimeout(() => {
    console.error(JSON.stringify({ message: "shutdown_timeout" }));
    process.exit(1);
  }, 10000);
  timer.unref();

  server.close((error) => {
    if (error) {
      console.error(JSON.stringify({ message: "shutdown_failed", error: error.message }));
      process.exit(1);
    }

    console.log(JSON.stringify({ message: "shutdown_complete" }));
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

