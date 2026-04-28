const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = [
    'docker system df',
    'docker stats --no-stream bfs-backend bfs-frontend bfs-db'
  ];
  
  let results = '';
  let completed = 0;

  commands.forEach(cmd => {
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      results += `\n--- Command: ${cmd} ---\n`;
      stream.on('close', (code, signal) => {
        completed++;
        if (completed === commands.length) {
          console.log(results);
          conn.end();
        }
      }).on('data', (data) => {
        results += data;
      }).stderr.on('data', (data) => {
        results += 'ERR: ' + data;
      });
    });
  });
}).connect({
  host: '43.156.118.56',
  port: 22,
  username: 'ubuntu',
  password: 'forest-38$-storm'
});
