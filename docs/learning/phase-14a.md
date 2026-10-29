# Phase 14a — Category ကနေ Product list ကို ချိတ်ခြင်း

> Roadmap Phase 14 ရဲ့ category filter တစ်ပိုင်းကို စောစော လုပ်ခဲ့တယ်။ Status filter ကတော့ Phase 8 (status column) ပြီးမှ လုပ်လို့ရမယ်။

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**မေးခွန်း: Product စုစုပေါင်း ၂၂ ခု ရှိပေမယ့် category တွေထဲမှာ ၂၁ ခုပဲ ဘာကြောင့် ရှိတာလဲ။**
`FOOD-001` (Instant Noodles) မှာ category မရှိလို့ ဖြစ်တယ်။ Sample SQL က `BEV-`၊ `SNK-`၊ `HOM-`၊ `PER-`၊ `STA-` နဲ့ စတဲ့ SKU တွေကိုပဲ category ထည့်ပေးခဲ့တယ်။ ဒါကြောင့် Categories page မှာ **"Uncategorized"** row ထည့်ခဲ့တယ်။ အခု ဂဏန်းတွေ ပေါင်းရင် product စုစုပေါင်းနဲ့ အမြဲ ညီတယ်။

**Workflow:**
1. Categories page မှာ category ကို နှိပ်ရင် `/products?category=<id>` ကို ရောက်တယ်။
2. Products page က အဲ့ဒီ category ထဲက product တွေကိုပဲ ပြတယ်။ Header မှာ "7 products in Beverages" လို့ ပြတယ်။
3. Table အပေါ်က **Category dropdown** နဲ့ filter ကို ပြောင်းလို့ ရတယ် (All / category တစ်ခုချင်း / Uncategorized)။ "Clear filter" နဲ့ ပြန်ဖြုတ်လို့ ရတယ်။
4. Pagination က filter နဲ့ တွဲအလုပ်လုပ်တယ်။ Filter ပြောင်းရင် page 1 ကို ပြန်သွားတယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **Category detail page သီးသန့် မဆောက်ဘဲ products page ကိုပဲ filter နဲ့ ပြန်သုံးတယ်။** Pagination၊ Edit၊ Stock၊ Delete အကုန် ရှိပြီးသားမို့ code ထပ်ရေးစရာ မလိုဘူး။
- **Filter ကို URL ထဲမှာ ထားတယ်** (`?category=`)။ Page နံပါတ်လိုပဲ refresh လုပ်လည်း မပျောက်ဘူး၊ link ကို bookmark လုပ်လည်း ရတယ်။ Categories page ကနေ ဒီ link ကိုပဲ ပို့တာ ဖြစ်တယ်။
- **Practice data ကို `seed.sql` ဆီ ရွှေ့ခဲ့တယ်။** `schema.sql` မှာ ဖွဲ့စည်းပုံ (table၊ policy) ပဲ ထားတယ်။ ဒါမှ schema ကို ထပ် run တိုင်း sample data က ကိုယ်ပြင်ထားတာကို ပြန်ဖျက် မပစ်တော့ဘူး။

## File တစ်ခုချင်းစီ

**`src/services/products.ts` (ပြင်တယ်)**
`listProducts(page, pageSize, category)` မှာ filter ထည့်လို့ ရလာတယ်။ `productsQuery()` helper က filter ကို တစ်နေရာတည်းမှာ ထည့်ပေးတယ်: category id ဆိုရင် `.eq('category_id', id)`၊ `'none'` ဆိုရင် `.is('category_id', null)`။ `countProducts(category)` ကို export လုပ်ထားလို့ Categories page ကလည်း သုံးလို့ရတယ်။

**`src/pages/ProductsPage.tsx` (ပြင်တယ်)**
Category dropdown ပါတဲ့ filter bar ထည့်ထားတယ်။ `updateParams()` က URL param တစ်ခု ပြောင်းတဲ့အခါ ကျန်တာတွေကို မပျောက်အောင် ထိန်းထားတယ်။ ဥပမာ page ပြောင်းရင် category filter ကျန်နေတယ်။

**`src/pages/CategoriesPage.tsx` (ပြင်တယ်)**
Category row တိုင်းကို products page ဆီ link လုပ်ထားတယ်။ Mouse တင်ရင် "View products →" ပေါ်တယ်။ အောက်ဆုံးမှာ Uncategorized row ပါတယ်။

**`frontend/supabase/seed.sql` (အသစ်)**
Sample product ၂၀ ခုနဲ့ sample category ၅ ခုကို ထည့်တဲ့ SQL ဖြစ်တယ်။ Practice data လိုချင်တဲ့အခါ SQL Editor မှာ run ပါ။ ထပ် run လည်း ပြဿနာ မရှိဘူး (ရှိပြီးသားကို ကျော်သွားတယ်)။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. `.eq()` နဲ့ `.is()` ကွာခြားချက်
SQL မှာ `category_id = null` ဆိုတာ ဘယ်တော့မှ true မဖြစ်ဘူး။ `null` က "မသိဘူး" ဆိုတဲ့ အဓိပ္ပာယ်ရှိလို့ ဘာနဲ့မှ "ညီ" လို့ မပြောနိုင်ဘူး။ ဒါကြောင့် `category_id is null` လို့ ရေးရတယ်။ Supabase မှာ `.is('category_id', null)` ဖြစ်တယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** Dart မှာ `x == null` က အလုပ်လုပ်ပေမယ့် SQL မှာ မလုပ်ဘူး။ ဒါက SQL ရဲ့ ထူးခြားချက် ဖြစ်တယ်။

### 2. Query builder ကို အဆင့်ဆင့် တည်ဆောက်ခြင်း
`let query = select(...)`၊ ပြီးရင် `if (...) query = query.eq(...)` ဆိုပြီး condition အလိုက် filter ထည့်တယ်။ ပြီးမှ `.order().range()` ဆက်ပြီး request ပို့တယ်။ `await` မလုပ်မချင်း request မထွက်သေးဘူး။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `supabase_flutter` မှာ `var q = supabase.from('products').select(); if (id != null) q = q.eq('category_id', id);` နဲ့ အတူတူပဲ။

### 3. URL param အများကြီး (`URLSearchParams`)
`?category=abc&page=2` လို param ၂ ခုရှိရင် တစ်ခုပြောင်းတဲ့အခါ ကျန်တစ်ခု မပျောက်အောင် `new URLSearchParams(prev)` နဲ့ copy ကူးပြီးမှ `.set()` / `.delete()` လုပ်တယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `uri.replace(queryParameters: {...uri.queryParameters, 'page': '2'})` နဲ့ ဆင်တူတယ်။

### 4. `Promise.all` — request ၂ ခုကို တပြိုင်နက် ပို့ခြင်း
Categories page မှာ category စာရင်းနဲ့ uncategorized အရေအတွက်ကို တစ်ခုပြီးမှ တစ်ခု မစောင့်ဘဲ တပြိုင်နက် ယူတယ်။ ဒါကြောင့် ပိုမြန်တယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `await Future.wait([listCategories(), countProducts()])` နဲ့ အတူတူပဲ။

### 5. Effect dependency ၂ ခု `[page, category]`
Page ဒါမှမဟုတ် category တစ်ခုခု ပြောင်းရင် data ပြန်ယူတယ်။ Dependency array ထဲမှာ effect က သုံးတဲ့ value အားလုံး ပါရမယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. Uncategorized product တွေကို ရှာဖို့ `.eq('category_id', null)` မသုံးဘဲ `.is('category_id', null)` ကို ဘာကြောင့် သုံးတာလဲ။
2. `/products?category=<Beverages id>&page=2` မှာ ရှိနေတုန်း dropdown ကနေ "Snacks" ကို ရွေးလိုက်ရင် URL က ဘာဖြစ်သွားမလဲ။ `page` ကို ဘာကြောင့် ဖြုတ်တာလဲ။
3. Sample data ကို `schema.sql` ထဲမှာ မထားဘဲ `seed.sql` ထဲမှာ ဘာကြောင့် ခွဲထားတာလဲ။
