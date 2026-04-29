const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  // Check logs and health
  const cmd = 'cd projects/business-flow-suite && docker compose logs --tail=20 backend && docker compose logs --tail=20 frontend';
  console.log('Running:', cmd);
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let result = '';
    stream.on('close', (code, signal) => {
      console.log('--- Verification Finished ---');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
      result += data;
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
      result += 'ERR: ' + data;
    });
  });
}).connect({
  host: '43.156.118.56',
  port: 22,
  username: 'ubuntu',
  password: 'forest-38$-storm'
});
