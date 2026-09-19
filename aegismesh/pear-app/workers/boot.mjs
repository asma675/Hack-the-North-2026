import startServer from '../ui/app.js';

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';
const root = import.meta.dirname;

await startServer({ port: PORT, host: HOST, root });
console.log('Vanguard Sovereign booted');
console.log(`  QVAC: primary inference (3-tier fallback)`);
console.log(`  Pear: P2P runtime (peer discovery, OTA updates)`);
console.log(`  Dashboard: http://${HOST}:${PORT}`);
