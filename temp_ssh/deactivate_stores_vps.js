const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const ids = ['de5f764b-ca3a-45b1-9a0d-3559278882eb', 'dec9e45b-8333-4404-a723-3a0497a7b144', 'c2221884-ce83-4493-a35a-17d372218694']; const result = await prisma.stores.updateMany({ where: { id: { in: ids } }, data: { status: 'inactive' } }); console.log('UPDATED:', result.count); } main();";
  const sshCmd = `docker exec bfs-backend node -e "${script}"`;
  conn.exec(sshCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => process.stdout.write(data)).on('close', () => conn.end());
  });
}).connect({ host: '150.109.15.108', port: 22, username: 'ubuntu', password: 'ocean-65%-forest' });
