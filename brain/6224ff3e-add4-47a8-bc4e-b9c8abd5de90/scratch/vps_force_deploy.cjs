const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Client Ready - FORCING DEPLOYMENT');
  
  const cmd = `
    cd /home/ubuntu/zenvix
    git reset --hard HEAD
    git pull origin main
    chmod +x vps-up.sh
    ./vps-up.sh
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log('--- DEPLOYMENT FINISHED ---');
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
