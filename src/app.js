"use strict";

const express = require("express");
const helmet = require("helmet");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createApp(config = {}) {
  const appName = config.appName || process.env.APP_NAME || "Node GKE CI/CD Demo";
  const appEnv = config.appEnv || process.env.APP_ENV || process.env.NODE_ENV || "development";
  const version = config.version || process.env.APP_VERSION || process.env.GITHUB_SHA || "local";

  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "style-src": ["'self'", "'unsafe-inline'"]
      }
    }
  }));

  app.get("/healthz", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/readyz", (_request, response) => {
    response.status(200).json({ status: "ready" });
  });

  app.get("/api/version", (_request, response) => {
    response.status(200).json({
      app: appName,
      environment: appEnv,
      version
    });
  });

  app.get("/", (_request, response) => {
    response.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(appName)}</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        align-items: center;
        background: #f7f7f4;
        color: #1f2933;
        display: grid;
        margin: 0;
        min-height: 100vh;
        padding: 24px;
      }

      main {
        max-width: 760px;
      }

      h1 {
        font-size: clamp(2rem, 6vw, 4rem);
        letter-spacing: 0;
        line-height: 1;
        margin: 0 0 18px;
      }

      p {
        font-size: 1.1rem;
        line-height: 1.65;
        margin: 0 0 24px;
      }

      dl {
        display: grid;
        gap: 12px;
        grid-template-columns: max-content 1fr;
        margin: 0;
      }

      dt {
        color: #52616b;
        font-weight: 700;
      }

      dd {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(appName)}</h1>
      <p>This container was built, scanned, pushed to Artifact Registry, and deployed to GKE by GitHub Actions.</p>
      <dl>
        <dt>Environment</dt>
        <dd>${escapeHtml(appEnv)}</dd>
        <dt>Version</dt>
        <dd>${escapeHtml(version)}</dd>
      </dl>
    </main>
  </body>
</html>`);
  });

  return app;
}

module.exports = { createApp };
