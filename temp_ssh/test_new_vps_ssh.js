const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready on 150.109.15.108');
  const cmd = 'ls -la';
  console.log('Running:', cmd);
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
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
  password: 'forest-38$-storm'
});
