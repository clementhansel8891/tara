const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('free -m && echo "---" && df -h && echo "---" && docker stats --no-stream', (err, stream) => {
    if (err) throw err;
    let result = '';
    stream.on('close', () => {
      console.log(result);
      conn.end();
    }).on('data', (data) => {
      result += data;
    });
  });
}).connect({
  host: '43.156.118.56',
  port: 22,
  username: 'ubuntu',
  password: 'forest-38$-storm'
});
