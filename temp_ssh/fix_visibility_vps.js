const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { try { const result = await prisma.explorer_files.updateMany({ where: { tenant_id: 'tnt-3rlhko', name: { startsWith: 'AuditReport_' } }, data: { access_level: 'shared' } }); console.log('UPDATED_FILES:', result.count); } catch (e) { console.log('ERROR:', e.message); } } main();";
  const sshCmd = `docker exec bfs-backend node -e "${script}"`;
  conn.exec(sshCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => process.stdout.write(data)).on('close', () => conn.end());
  });
}).connect({ host: '150.109.15.108', port: 22, username: 'ubuntu', password: 'ocean-65%-forest' });
