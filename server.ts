import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

// Safely derive __dirname in both ESM and CommonJS
let currentDir = process.cwd();
try {
  if (typeof __dirname !== 'undefined') {
    currentDir = __dirname;
  } else {
    // @ts-ignore
    currentDir = path.dirname(fileURLToPath(import.meta.url));
  }
} catch (e) {
  // Fallback to process.cwd() if anything fails
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Serve static assets from the public folder (e.g. logo.jpg)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve static files in production, or use Vite dev server in development
  if (process.env.NODE_ENV !== "production") {
    console.log('Starting server in DEVELOPMENT mode with Vite middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Explicitly serve transformed index.html for development catch-all
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log('Starting server in PRODUCTION mode...');
    const distPath = currentDir;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
