# Gyors telepítési útmutató - Supabase Tasks Config

## 1. lépés - Tábla létrehozása ✅

Supabase Dashboard → SQL Editor → Másold be és futtasd:

📁 Fájl: `supabase/migrations/20250101000000_create_tasks_config.sql`

---

## 2. lépés - Adatok feltöltése 📤

### A) Manuális SQL beszúrás (GYORS) ⚡

Ha még nincs `.env.local` beállítva:

1. Supabase Dashboard → SQL Editor
2. Másold be: `supabase/migrations/manual_insert_tasks.sql`
3. Kattints: **Run** ▶️
4. ✅ Kész! 3 task feltöltve

### B) Script futtatás (ha van .env.local) 🔧

```bash
# 1. Másold az .env.example-t
cp .env.example .env.local

# 2. Töltsd ki a Supabase adatokkal:
# - Project Settings → API
# - URL, anon key, service_role key

# 3. Futtasd a scriptet
npx tsx scripts/uploadInitialConfig.ts
```

---

## Ellenőrzés ✔️

Supabase → Table Editor → `tasks_config` táblázat

Látnod kell:
- 1 sor
- `config_data` mező: 3 task
- `version`: 1

---

## Következő lépés

Most már használhatod az **/admin** oldalt! 🎉

- Módosítasz valamit
- Kattintasz **💾 Save**
- Elmegy Supabase-re

Build során automatikusan lekéri.
