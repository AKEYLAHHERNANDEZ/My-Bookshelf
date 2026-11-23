-- Books are stored as JSON objects inside library_state.data, not in a books table.
-- Backfill defaults while preserving every other library and book field.
UPDATE library_state
SET data = json_set(
  data,
  '$.books',
  json(COALESCE((
    SELECT json_group_array(json_set(
      value,
      '$.spine_url', COALESCE(json_extract(value, '$.spine_url'), NULL),
      '$.display_mode', COALESCE(json_extract(value, '$.display_mode'), 'spine')
    ))
    FROM json_each(data, '$.books')
  ), '[]'))
WHERE json_valid(data) AND json_type(data, '$.books') = 'array';
