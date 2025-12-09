# ⚡ Gyors Start - Tiszta Lappal

## 🎯 Most mit csinálj?

### 1️⃣ Felhasználó létrehozása (2 perc)

**Supabase Dashboard → SQL Editor → Run:**

```sql
-- Új teszt felhasználó
INSERT INTO approved_customers (customer_name, has_calculated)
VALUES ('Teszt Béla', false)
RETURNING *;
```

**📋 Másold ki az ID-t!** (uuid formátum: `abc123...`)

---

### 2️⃣ Első Task feltöltése (1 perc)

**Supabase Dashboard → Table Editor → tasks_config → Insert row**

Mezők:
- **config_data**: Másold be az alábbi JSON-t →

```json
{
  "tasks": [
    {
      "id": "task-1",
      "name": "Teszt összeadás",
      "inputVariables": [
        {"name": "a", "label": "Első szám"},
        {"name": "b", "label": "Második szám"}
      ],
      "equations": [
        {"outputVariable": "sum", "formula": "a+b"}
      ],
      "showingText": "Eredmény: {{sum}}",
      "outputVariables": [
        {"name": "sum", "label": "sum", "unit": ""}
      ],
      "outputPlaceholders": [],
      "images": []
    }
  ],
  "lastUpdated": "2025-12-09T14:38:00.000Z"
}
```

- **version**: `1`

**Save**

---

### 3️⃣ Tesztelés (3 perc)

```bash
# Local dev
npm run dev
```

**A) Főoldal** → `http://localhost:3000`
- Írd be a másolt UUID-t
- Enter → átirányít `/calculate`

**B) Calculate oldal**
- Látod a "Teszt összeadás" taskot?
- Töltsd ki: a=5, b=3
- Calculate gomb
- → Átirányít `/results`

**C) Results oldal**
- Látod: "Eredmény: 8" ? ✅ **Működik!**

---

### 4️⃣ Production Deploy

```bash
git push origin dev
```

Vercel build log:
```
🔄 Syncing tasks config from Supabase...
✅ Loaded config from Supabase with 1 tasks
```

**Kész!** 🎉

---

## 📚 Részletes infó

Lásd: **WORKFLOW_TESZT.md** - teljes lépésről-lépésre útmutató

---

## 🆘 Hiba esetén

**"No tasks" admin oldalon**
→ Reload gomb

**"Invalid customer"**
→ Rossz UUID, ellenőrizd: `SELECT * FROM approved_customers;`

**Build fail**
→ Environment variables hiányoznak Vercel-ben
