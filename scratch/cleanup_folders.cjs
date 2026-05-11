const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Ready');
    const canonicalId = 'b6218015-a59f-4334-8385-13d56fd78300';
    const duplicateIds = ['fd06ae47-88c9-464d-b9f6-8b4ee96a5199', 'b4c567e0-43bc-4110-9313-3bd98b86c4fb'];
    
    const sql = `
        BEGIN;
        -- Move files to canonical folder
        UPDATE explorer_files SET folder_id = '${canonicalId}' WHERE folder_id IN (${duplicateIds.map(id => `'${id}'`).join(',')});
        
        -- Delete duplicate folders
        DELETE FROM explorer_folders WHERE id IN (${duplicateIds.map(id => `'${id}'`).join(',')});
        
        -- Ensure canonical folder is shared and in root
        UPDATE explorer_folders SET access_level = 'shared', company_id = NULL, department_id = NULL, parent_id = NULL WHERE id = '${canonicalId}';
        COMMIT;
    `;

    conn.exec(`docker exec bfs-db psql -U zenvix -d zenvix_prod -c "${sql}"`, (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => console.log('OUT: ' + data));
        stream.stderr.on('data', (data) => console.log('STDERR: ' + data));
        stream.on('close', () => {
            console.log('Cleanup finished');
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
