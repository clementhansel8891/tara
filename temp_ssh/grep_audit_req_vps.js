const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sshCmd = `docker logs --tail 2000 bfs-backend 2>&1 | grep -B 15 -A 15 "PUT /v1/inventory/audit-cycles"`;
  conn.exec(sshCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => process.stdout.write(data)).on('close', () => conn.end());
  });
}).connect({ host: '150.109.15.108', port: 22, username: 'ubuntu', password: 'ocean-65%-forest' });
