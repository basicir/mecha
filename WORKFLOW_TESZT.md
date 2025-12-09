# 🧪 Teljes Workflow Teszt - Tiszta Lappal

## 📋 Jelenlegi Helyzet
- ✅ Supabase táblák üresek (tiszta lap)
- ✅ tasks.json üres
- ✅ Rendszer készen áll az első konfig létrehozására

---

## 🚀 1. FÁZIS: Supabase Beállítás

### A) Táblák létrehozása

**Supabase Dashboard → SQL Editor**

Futtasd sorban:

#### 1. Schema (felhasználók táblái)
```sql
-- supabase/migrations/001_initial_schema.sql
```
Ez létrehozza:
- `approved_customers` (engedélyezett felhasználók)
- `user_input_data` (számítások eredményei)

#### 2. Tasks config tábla
```sql
-- supabase/migrations/20250101000000_create_tasks_config.sql
```
Ez létrehozza:
- `tasks_config` (task konfigurációk)

---

## 👤 2. FÁZIS: Teszt Felhasználó Hozzáadása

### Módszer A: SQL Editor (GYORS)

**Supabase Dashboard → SQL Editor**

```sql
-- Új jóváhagyott felhasználó létrehozása
INSERT INTO approved_customers (customer_name, has_calculated)
VALUES ('Teszt Béla', false);

-- Ellenőrzés
SELECT * FROM approved_customers;
```

**Másold ki a generált UUID-t!** (pl: `abc12345-...`)

### Módszer B: Table Editor UI

1. **Supabase Dashboard → Table Editor**
2. Válaszd: **approved_customers**
3. Kattints: **Insert row**
4. Mezők:
   - **customer_name**: `Teszt Béla`
   - **has_calculated**: `false`
5. **Save**
6. **Másold ki a generált ID-t!**

---

## ⚙️ 3. FÁZIS: Task Konfiguráció Létrehozása

### A) Admin Oldal - Első Task

1. **Indítsd el dev szervert:**
   ```bash
   npm run dev
   ```

2. **Menj az admin oldalra:**
   ```
   http://localhost:3000/admin
   ```

3. **Látnod kell:**
   - "No tasks" üzenet
   - 🔄 Reload gomb
   - 💾 Save gomb

4. **Hozz létre egy egyszerű taskot:**

   Mivel nincs UI task hozzáadására, **manuálisan szerkeszd a config-ot**:

### B) Egyszerű Task Példa - Manuális Hozzáadás

**Supabase Dashboard → Table Editor → tasks_config → Insert row**

**config_data** mezőbe:
```json
{
  "tasks": [
    {
      "id": "task-1",
      "name": "Egyszerű összeadás teszt",
      "inputVariables": [
        {"name": "a", "label": "Első szám"},
        {"name": "b", "label": "Második szám"}
      ],
      "equations": [
        {"outputVariable": "sum", "formula": "a+b"}
      ],
      "showingText": "Eredmény: {{sum}}",
      "outputVariables": [
        {"name": "sum", "label": "Összeg", "unit": ""}
      ],
      "outputPlaceholders": [],
      "images": []
    }
  ],
  "lastUpdated": "2025-12-09T14:38:00.000Z"
}
```

**version:** `1`

**Save**

---

## 🧮 4. FÁZIS: Számítás Tesztelés

### A) Validálás - ID Érvényesítés

1. **Menj a főoldalra:**
   ```
   http://localhost:3000
   ```

2. **Írj be egy ID-t** (a korábban létrehozott UUID)

3. **Várható eredmény:**
   - ✅ Érvényes ID → átirányít `/calculate?id=...` -ra
   - ❌ Hibás ID → error üzenet

### B) Calculation Page

1. **Calculate oldalon:**
   ```
   http://localhost:3000/calculate?id=ABC123...
   ```

2. **Látnod kell:**
   - Task 1: "Egyszerű összeadás teszt"
   - Input mezők: "Első szám", "Második szám"
   - "Calculate" gomb (inaktív amíg nem töltöd ki)

3. **Töltsd ki:**
   - Első szám: `5`
   - Második szám: `3`

4. **Kattints: Calculate**

5. **Várható:**
   - → Átirányít `/results?id=...`
   - Eredmény: `Eredmény: 8`

### C) Results Page

**Results oldalon:**
```
http://localhost:3000/results?id=ABC123...
```

**Látnod kell:**
- ✅ "Eredmény: 8"

**Újratöltésnél:**
- ✅ Ugyanaz az eredmény (mert elmentettük)

**Ha újra próbálsz számolni:**
- ❌ "Already calculated" error
- `has_calculated` = true a DB-ben

---

## 🔄 5. FÁZIS: Módosítás és Build Teszt

### A) Config Módosítás Admin Oldalon

1. **Ha van admin felület task szerkesztésére:**
   - Szerkeszd a task nevét
   - Adj hozzá új változót
   - Kattints: **💾 Save**

2. **Várható:**
   - "✅ Saved to Supabase. Changes will sync on next build."

3. **Ellenőrzés Supabase-ben:**
   - Table Editor → tasks_config
   - **version** = 2 (növekedett!)

### B) Build és Deploy

```bash
# Build teszt local
npm run build

# Várható log:
# 🔄 Syncing tasks config from Supabase...
# ✅ Loaded config from Supabase with 1 tasks
# 💾 Saved to: .../config/tasks.json
# ✨ Sync complete!
```

### C) Production Deploy (Vercel)

```bash
git add -A
git commit -m "test: workflow testing"
git push origin dev
```

**Vercel build log-ban látni fogod:**
- Prebuild: Supabase sync
- Config betöltve
- Build sikeres

---

## ✅ Ellenőrző Lista

### Supabase Setup
- [ ] `001_initial_schema.sql` futtatva
- [ ] `20250101000000_create_tasks_config.sql` futtatva
- [ ] Environment variables beállítva Vercel-ben

### Felhasználó
- [ ] Teszt felhasználó létrehozva
- [ ] UUID kimásolva

### Task Config
- [ ] Első task feltöltve Supabase-re
- [ ] Admin oldalon látható
- [ ] Version = 1

### End-to-End Flow
- [ ] ID validáció működik
- [ ] Calculate page betölti a taskokat
- [ ] Inputok kitölthetők
- [ ] Calculate gomb működik
- [ ] Results page mutatja az eredményt
- [ ] "Already calculated" védelem működik

### Build & Deploy
- [ ] Local build sync-el Supabase-ről
- [ ] Vercel build sikeres
- [ ] Production is működik

---

## 🐛 Gyakori Problémák

### "No tasks" admin oldalon
- Ellenőrizd: van-e adat a `tasks_config` táblában
- Reload gomb: lekéri Supabase-ről

### "Invalid customer" hiba
- UUID rossz vagy nincs ilyen a DB-ben
- Ellenőrizd: `SELECT * FROM approved_customers;`

### Build hibák
- Environment variables hiányoznak
- Supabase connection timeout

### "Already calculated" 
- Ez NORMÁLIS 2. próbálkozásnál!
- Hozz létre új felhasználót új teszthez
