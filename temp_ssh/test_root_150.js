const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready as root on 150.109.15.108');
  conn.exec('uptime', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => console.log('STDOUT: ' + d));
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect({
  host: '150.109.15.108',
  port: 22,
  username: 'root',
  password: 'forest-38$-storm'
});
