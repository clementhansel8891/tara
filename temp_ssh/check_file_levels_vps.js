const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { try { const files = await prisma.explorer_files.findMany({ where: { tenant_id: 'tnt-3rlhko', name: { startsWith: 'AuditReport_' } }, select: { name: true, access_level: true, company_id: true } }); console.log('FILES_DETAILS:', JSON.stringify(files)); } catch (e) { console.log('ERROR:', e.message); } } main();";
  const sshCmd = `docker exec bfs-backend node -e "${script}"`;
  conn.exec(sshCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => process.stdout.write(data)).on('close', () => conn.end());
  });
}).connect({ host: '150.109.15.108', port: 22, username: 'ubuntu', password: 'ocean-65%-forest' });
