const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const folder = await prisma.explorer_folders.findFirst({ where: { tenant_id: 'tnt-3rlhko', name: 'Audit Reports' } }); if (!folder) { console.log('Folder not found'); return; } const files = await prisma.explorer_files.findMany({ where: { folder_id: folder.id }, select: { name: true, created_at: true } }); console.log('FILES:', JSON.stringify(files)); } main();";
  const sshCmd = `docker exec bfs-backend node -e "${script}"`;
  conn.exec(sshCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => process.stdout.write(data)).on('close', () => conn.end());
  });
}).connect({ host: '150.109.15.108', port: 22, username: 'ubuntu', password: 'ocean-65%-forest' });
