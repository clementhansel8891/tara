const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Ready');
    // Using docker exec to run psql inside the container
    conn.exec('docker exec bfs-db psql -U zenvix -d zenvix_prod -c "SELECT id, name, tenant_id FROM explorer_folders;"', (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => {
            console.log('OUT: ' + data);
        });
        stream.stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
        stream.on('close', () => {
            console.log('Stream closed');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect({
    host: '150.109.15.108',
    port: 22,
    username: 'ubuntu',
    password: 'ocean-65%-forest'
});
