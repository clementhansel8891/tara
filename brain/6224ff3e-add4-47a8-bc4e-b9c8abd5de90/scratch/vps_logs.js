const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Client Ready');
  
  // Commands to run
  // 1. Check docker status
  // 2. Check backend logs (last 100 lines)
  // 3. Check frontend logs (last 100 lines)
  // 4. Check deployment log
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
    cat business-flow-suite-v2/logs/vps-deploy.log | tail -n 100
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
  password: 'forest-38$-storm'
});
