const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Client Ready (ubuntu)');
  
  const cmd = `
    echo "--- DOCKER STATUS ---"
    docker ps
    echo ""
    echo "--- BACKEND LOGS ---"
    docker logs --tail 100 bfs-backend
    echo ""
    echo "--- FRONTEND LOGS ---"
    docker logs --tail 100 bfs-frontend
    echo ""
    echo "--- DEPLOYMENT LOG ---"
    [ -f /home/ubuntu/zenvix/logs/vps-deploy.log ] && cat /home/ubuntu/zenvix/logs/vps-deploy.log | tail -n 100 || echo "Deployment log not found"
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log('--- SSH Session Closed ---');
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
