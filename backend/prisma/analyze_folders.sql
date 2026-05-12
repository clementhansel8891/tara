-- Find empty Stock Opname folders
SELECT f.id, f.name, f.parent_id, (SELECT count(*) FROM explorer_files WHERE folder_id = f.id) as files, (SELECT count(*) FROM explorer_folders WHERE parent_id = f.id) as subfolders
FROM explorer_folders f
WHERE f.name LIKE 'Stock Opname%';
