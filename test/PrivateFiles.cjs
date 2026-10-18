const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('Private credential file isolation', function () {
  it('prevents Vite from serving credential files, including raw imports', async function () {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blockauth-private-'));
    let server;
    try {
      const { createServer } = await import('vite');
      const { default: config } = await import('../vite.config.js');
      fs.mkdirSync(path.join(directory, '.auth-data'));
      fs.writeFileSync(path.join(directory, '.auth-data', 'users.json'), 'PRIVATE-CREDENTIAL-SENTINEL');
      fs.writeFileSync(path.join(directory, 'index.html'), '<div>Test</div>');
      server = await createServer({
        ...config, configFile: false, root: directory, cacheDir: path.join(directory, '.vite'), logLevel: 'silent',
        server: { ...config.server, host: '127.0.0.1', port: 0, strictPort: false, watch: null },
        optimizeDeps: { noDiscovery: true, include: [] },
      });
      await server.listen();
      const port = server.httpServer.address().port;
      for (const suffix of ['', '?raw', '?import']) {
        const response = await fetch(`http://127.0.0.1:${port}/.auth-data/users.json${suffix}`);
        assert.equal(response.status, 403);
        assert.ok(!(await response.text()).includes('PRIVATE-CREDENTIAL-SENTINEL'));
      }
    } finally {
      await server?.close();
      assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
      assert.ok(path.basename(directory).startsWith('blockauth-private-'));
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
