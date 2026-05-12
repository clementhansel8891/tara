-- 1. Move everything from 'Stock Opname' (old name) to the first 'Stock Opname Reports' (new name)
UPDATE explorer_folders 
SET parent_id = 'b6218015-a59f-4334-8385-13d56fd78300' 
WHERE parent_id = '8c28694b-e50a-4033-ba8b-30b548580a2d';

UPDATE explorer_files 
SET folder_id = 'b6218015-a59f-4334-8385-13d56fd78300' 
WHERE folder_id = '8c28694b-e50a-4033-ba8b-30b548580a2d';

-- 2. Consolidate duplicate 'Stock Opname Reports'
UPDATE explorer_files 
SET folder_id = 'b6218015-a59f-4334-8385-13d56fd78300' 
WHERE folder_id = '6f6d0cb4-2894-425b-9e07-c1dadb2b8f12';

-- 3. Delete the now-empty duplicates
DELETE FROM explorer_folders WHERE id = '8c28694b-e50a-4033-ba8b-30b548580a2d';
DELETE FROM explorer_folders WHERE id = '6f6d0cb4-2894-425b-9e07-c1dadb2b8f12';
