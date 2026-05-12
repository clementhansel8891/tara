SELECT name, pg_typeof(metadata), metadata->>'type' as type_val FROM explorer_files WHERE name LIKE 'Stock%';
