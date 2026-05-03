const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Client Ready - FETCHING BACKEND LOGS');
  
  const cmd = 'docker logs --tail 200 bfs-backend';
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log('--- BACKEND LOGS FETCHED ---');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('SSH Connection Error:', err.message);
}).connect({
  host: '150.109.15.108',
  port: 22,
  username: 'ubuntu',
  password: 'ocean-65%-forest'
});
