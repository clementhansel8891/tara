const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Client :: Ready (ubuntu@150.109.15.108)');
  const script = "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { console.log('STORES for tnt-3rlhko with location_id:'); console.log(JSON.stringify(await prisma.stores.findMany({ where: { tenant_id: 'tnt-3rlhko' }, select: { id: true, name: true, code: true, location_id: true } }))); } main();";
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
