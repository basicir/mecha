-- EGYSZERŰ MÓDSZER: Üres táblát hozz létre, majd a Supabase Table Editor-ban add hozzá manuálisan

-- 1. Futtasd ezt, hogy BIZTOSAN legyen egy üres sor:
INSERT INTO tasks_config (config_data, version)
VALUES ('{"tasks": [], "lastUpdated": "2025-12-09T14:00:00.000Z"}'::jsonb, 1)
ON CONFLICT DO NOTHING;

-- 2. Ellenőrizd:
SELECT * FROM tasks_config;

-- Ha látod az üres sort, AKKOR:
-- 3. Menj a Supabase Table Editor-be
-- 4. Kattints a tasks_config táblára
-- 5. Kattints az INSERT ROW gombra VAGY szerkeszd az üres sort
-- 6. Másold be az alábbi JSON-t a config_data mezőbe:
