# 🚀 Gyors telepítési útmutató - Supabase Tasks Config

## ⚠️ LEGEGYSZERŰBB MÓDSZER - Supabase Table Editor UI

### 1. lépés - Tábla létrehozása ✅

**Supabase Dashboard** → **SQL Editor** → Másold be és futtasd:

📁 Fájl: `supabase/migrations/20250101000000_create_tasks_config.sql`

Ez létrehozza a `tasks_config` táblát.

---

### 2. lépés - Adatok feltöltése UI-n keresztül 📤

#### A) Nyisd meg a JSON fájlt

Fájl: **`supabase/initial_config_data.json`**

Másold ki a **TELJES** tartalmat (Ctrl+A, Ctrl+C)

#### B) Supabase Table Editor

1. **Supabase Dashboard** → **Table Editor**
2. Válaszd ki: **tasks_config** táblát
3. Kattints: **Insert** → **Insert row** gombra
4. Mezők:
   - **config_data**: Illeszd be (Ctrl+V) a JSON tartalmat
   - **version**: Írd be: `1`
5. Kattints: **Save**

---

### 3. lépés - Ellenőrzés ✅

**Table Editor** → **tasks_config**

Látnod kell:
- ✅ **1 sor**
- ✅ **config_data**: kinyitva látható a JSON szerkezet
- ✅ **version**: 1
- ✅ **created_at**: most
- ✅ **updated_at**: most

Kattints a config_data mezőre → láthatod a 3 task adatait.

---

## 🎯 Készen vagy!

Most próbáld ki:

1. **Indítsd el local dev szervert:**
   ```bash
   npm run dev
   ```

2. **Menj az admin oldalra:**
   ```
   http://localhost:3000/admin
   ```

3. **Kattints: 🔄 Reload**
   - Látod a 3 taskot?
   - ✅ Működik!

4. **Módosíts bármit és kattints: 💾 Save**
   - Elmegy Supabase-re
   - Refresh után a Table Editor-ban látod a version 2-t!

---

## 🔧 Alternatív módszer - .env.local + script

Ha szeretnéd automatizálni:

```bash
# 1. Másold az .env fájlt
cp .env.example .env.local

# 2. Töltsd ki (Supabase Dashboard → Settings → API):
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 3. Futtasd
npx tsx scripts/uploadInitialConfig.ts
```

---

## 📋 Vercel deployment beállítás

**Vercel Dashboard** → **Project Settings** → **Environment Variables**

Add hozzá mind a 3 változót:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `SUPABASE_SERVICE_ROLE_KEY`

Redeploy → Build során automatikusan szinkronizál Supabase-ről! 🎉

---

## ❓ Hibaelhárítás

### "Admin oldal üres, nincs task"

1. Ellenőrizd Supabase Table Editor-ban van-e adat
2. Nézd meg a `.env.local` fájlt, jók-e az URL-ek
3. Dev server újraindítás: `Ctrl+C`, majd `npm run dev`

### "Save nem működik admin oldalon"

Kell a `SUPABASE_SERVICE_ROLE_KEY` a `.env.local`-ban!

### "Build során nem frissül a tasks.json"

Vercel-ben add hozzá az environment variable-öket!
