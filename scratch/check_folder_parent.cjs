const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Ready');
    // Check folders with parent_id
    conn.exec('docker exec bfs-db psql -U zenvix -d zenvix_prod -c "SELECT id, name, parent_id, tenant_id FROM explorer_folders WHERE name = \'Stock Opname Reports\';"', (err, stream) => {
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
