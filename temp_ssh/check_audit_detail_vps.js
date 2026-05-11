const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { try { const audit = await prisma.inventory_audit_cycles.findUnique({ where: { id: 'e5e60508-e3d8-4bd6-9855-d0ccf39249de' } }); console.log('AUDIT_DATA:', JSON.stringify(audit)); } catch (e) { console.log('ERROR:', e.message); } } main();";
  const sshCmd = `docker exec bfs-backend node -e "${script}"`;
  conn.exec(sshCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => process.stdout.write(data)).on('close', () => conn.end());
  });
}).connect({ host: '150.109.15.108', port: 22, username: 'ubuntu', password: 'ocean-65%-forest' });
