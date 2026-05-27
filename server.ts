import express from 'express';
import cors from 'cors';
import https from 'https';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(cors());

const PROXY_INSTANCES = [
  { name: 'Inv.ThePixora (CA)', url: 'https://inv.thepixora.com' },
  { name: 'Yewtu.be', url: 'https://yewtu.be' },
  { name: 'Vid.Puffyan', url: 'https://vid.puffyan.us' },
  { name: 'Invidious.ProjectSegfau', url: 'https://invidious.projectsegfau.lt' },
  { name: 'YT.ArtemisLena', url: 'https://yt.artemislena.eu' },
  { name: 'Inv.Nadeko', url: 'https://inv.nadeko.net' },
  { name: 'Invidious.NerdVPN', url: 'https://invidious.nerdvpn.de' },
  { name: 'YT.ChocolateMoo', url: 'https://yt.chocolatemoo53.com' },
  { name: 'Invidious.F5.si', url: 'https://invidious.f5.si' },
  { name: 'Invidious.Tiekoetter', url: 'https://invidious.tiekoetter.com' },
  { name: 'Invidious.io', url: 'https://invidious.io' }
];

app.get('/api/proxies', (req, res) => {
  res.json(PROXY_INSTANCES);
});

app.get('/api/ping', async (req, res) => {
  const promises = PROXY_INSTANCES.map(proxy => {
    return new Promise((resolve) => {
      const start = Date.now();
      const req = https.get(proxy.url, { timeout: 3000 }, (resp) => {
        let isValid = resp.statusCode === 200;
        
        // Also verify frame options are permissive
        const frameOptions = resp.headers['x-frame-options'];
        const csp = resp.headers['content-security-policy'] || '';
        
        if (frameOptions && frameOptions.toUpperCase() === 'DENY') isValid = false;
        if (frameOptions && frameOptions.toUpperCase() === 'SAMEORIGIN') isValid = false;
        if (csp.toLowerCase().includes("frame-ancestors 'none'")) isValid = false;

        // Discard data
        resp.on('data', () => {});
        resp.on('end', () => {
          resolve({
            url: proxy.url,
            name: proxy.name,
            latency: isValid ? Date.now() - start : Infinity,
            valid: isValid,
            statusCode: resp.statusCode
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ url: proxy.url, latency: Infinity, valid: false, statusCode: 'TIMEOUT' });
      });

      req.on('error', (err) => {
        resolve({ url: proxy.url, latency: Infinity, valid: false, statusCode: 'ERROR' });
      });
    });
  });

  const results = await Promise.all(promises);
  // Sort by latency
  const valid = results.filter((r: any) => r.valid).sort((a: any, b: any) => a.latency - b.latency);
  
  res.json({
    fastest: valid.length > 0 ? valid[0] : null,
    all: results
  });
});

// Vite middleware development mode support
if (process.env.NODE_ENV !== "production") {
  const setupVite = async () => {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => console.log(`Dev Server listening on ${PORT}`));
  };
  setupVite();
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
