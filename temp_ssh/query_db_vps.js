const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Client :: Ready (ubuntu@150.109.15.108)');
  const cmd = `docker exec bfs-backend npx prisma db query "SELECT id, name, code FROM tenants" --json && docker exec bfs-backend npx prisma db query "SELECT id, name, code, tenant_id FROM locations WHERE name LIKE '%Anchor%'" --json`;
  // Actually, prisma db query is not a standard command. I'll use a simple script.
  const script = "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { console.log('TENANTS:'); console.log(JSON.stringify(await prisma.tenants.findMany({ select: { id: true, name: true, code: true } }))); console.log('LOCATIONS (Anchor):'); console.log(JSON.stringify(await prisma.locations.findMany({ where: { name: { contains: 'Anchor' } }, select: { id: true, name: true, code: true, tenant_id: true } }))); } main();";
  const sshCmd = `docker exec bfs-backend node -e "${script}"`;
  console.log('Executing:', sshCmd);
  
  conn.exec(sshCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('\nStream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect({
  host: '150.109.15.108',
  port: 22,
  username: 'ubuntu',
  password: 'ocean-65%-forest'
});
