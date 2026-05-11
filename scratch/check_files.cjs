const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Ready');
    // Check files and their folder associations
    conn.exec('docker exec bfs-db psql -U zenvix -d zenvix_prod -c "SELECT f.id, f.name, f.folder_id, d.name as folder_name FROM explorer_files f LEFT JOIN explorer_folders d ON f.folder_id = d.id WHERE d.name = \'Stock Opname Reports\';"', (err, stream) => {
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
