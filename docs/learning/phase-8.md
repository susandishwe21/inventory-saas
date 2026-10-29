# Phase 8 — Cost price၊ Low-stock level နဲ့ Status pill

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**ရလဒ်:** Product တိုင်းမှာ field အသစ် နှစ်ခု ရှိလာတယ်:
- **Cost price** (ဝယ်ဈေး)
- **Low-stock level** ("stock နည်းပြီ" လို့ သတ်မှတ်တဲ့ အရေအတွက်၊ default 10)

Table မှာ **Status** pill ပေါ်တယ်:

| Status | ဘယ်အချိန် | Pill |
|---|---|---|
| `in` | stock > low-stock level | 🟢 In stock |
| `low` | 0 < stock ≤ low-stock level | 🟡 Low stock |
| `out` | stock = 0 | 🔴 Out of stock |

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **`status` ကို generated column လုပ်ထားတယ်။** Database က `stock_quantity` နဲ့ `low_stock_level` ကနေ အမြဲ တွက်ပေးတယ်။
  - Stock trigger က `stock_quantity` ကို ပြောင်းတာနဲ့ status လည်း ချက်ချင်း ပြောင်းတယ်။ App က ဘာမှ လုပ်စရာ မလိုဘူး။
  - ဘယ်သူမှ status ကို လက်နဲ့ ရေးလို့ မရဘူး။ ဒါကြောင့် "stock 0 ဖြစ်နေပေမယ့် status က in" ဆိုတာမျိုး မဖြစ်နိုင်ဘူး။
  - `stored` ဖြစ်လို့ table ထဲ တကယ် သိမ်းထားတယ်။ Phase 14 မှာ `?status=low` filter ကို database မှာ တိုက်ရိုက် ရှာလို့ရမယ်။
- **Status ကို React မှာ မတွက်ဘဲ database မှာ တွက်တယ်။** React မှာ တွက်ရင် page တစ်ခုမှာ ပြလို့ရပေမယ့် "low stock product တွေကိုပဲ ပြ" ဆိုတဲ့ filter နဲ့ pagination ကို database မှာ လုပ်လို့ မရတော့ဘူး။ Dashboard (Phase 9) မှာ ရေတွက်တာလည်း ဒီ column ကို သုံးမယ်။
- **`add column if not exists` ကို သုံးတယ်။** Table ရှိပြီးသား ဖြစ်လို့ `create table` ကို ပြင်ရုံနဲ့ column အသစ် မဝင်ဘူး (`if not exists` ကြောင့် ကျော်သွားမယ်)။ `alter table` က ရှိပြီးသား database မှာလည်း database အသစ်မှာလည်း အလုပ်လုပ်တယ်။
- **Column privilege မှာ `cost_price` နဲ့ `low_stock_level` ကို ထည့်ရတယ်။** Phase 5 မှာ "app ရေးမယ့် column အသစ်တိုင်းကို grant မှာ ထည့်ရမယ်" လို့ မှတ်ထားခဲ့တယ်။ မထည့်ရင် save လုပ်တဲ့အခါ "permission denied" တက်မယ်။ `status` ကိုတော့ မထည့်ဘူး။ ဒါက database ကပဲ တွက်တဲ့ column ဖြစ်တယ်။

## File တစ်ခုချင်းစီ

**`supabase/schema.sql` (section 3 နဲ့ 5 ပြင်တယ်)**
`cost_price`၊ `low_stock_level`၊ `status` column သုံးခုကို ထည့်တယ်။ Column ရေးခွင့် grant မှာ column နှစ်ခု ထည့်တယ်။

**`supabase/seed.sql` (ပြင်တယ်)**
Sample product တွေမှာ cost price ပါလာတယ်။ အရင်ကတည်းက ရှိပြီးသား sample product တွေရဲ့ cost price က 0 ဖြစ်နေရင် ဖြည့်ပေးတယ်။ နောက်ဆုံးမှာ low/out အရေအတွက်ကိုပါ ပြတယ်။

**`src/components/StockStatusPill.tsx` (အသစ်)**
Status (`in`/`low`/`out`) ကို လက်ခံပြီး အရောင်ပါတဲ့ pill ပြတယ်။

**`src/components/ProductForm.tsx` (ပြင်တယ်)**
"Cost price" နဲ့ "Low-stock level" field တွေ ထည့်တယ်။ "Price" ကို "Selling price" လို့ နာမည်ပြောင်းတယ်။ Low-stock level က ကိန်းပြည့် ဖြစ်ရမယ်။

**`src/pages/ProductsPage.tsx`၊ `src/types.ts`၊ `src/services/products.ts` (ပြင်တယ်)**
Table မှာ Status column ထည့်တယ်။ Type မှာ `StockStatus` ထည့်တယ်။ `cost_price` ကို number ပြောင်းတယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Generated column
`generated always as (...) stored`: တခြား column တွေကနေ အလိုအလျောက် တွက်တဲ့ column ဖြစ်တယ်။ Row ပြောင်းတိုင်း ပြန်တွက်တယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** class ထဲက getter နဲ့ ဆင်တူတယ်: `StockStatus get status => stock == 0 ? out : stock <= lowLevel ? low : inStock;`။ ကွာခြားချက်က getter ဟာ object ထဲမှာပဲ ရှိပြီး database query မှာ သုံးလို့ မရဘူး။ Generated column ကတော့ database ထဲမှာ ရှိလို့ `where status = 'low'` လို့ ရှာလို့ရတယ်။

### 2. `Record<StockStatus, ...>` နဲ့ lookup table
`StockStatusPill` မှာ `if/else` မရေးဘဲ `STYLES[status]` နဲ့ ယူတယ်။ `Record<StockStatus, …>` ဖြစ်လို့ status အသစ်တစ်ခု ထပ်ထည့်ပြီး style မထည့်ရင် TypeScript က error ပြတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** Dart 3 ရဲ့ `switch (status) { StockStatus.in => ..., StockStatus.low => ..., }` expression နဲ့ ဆင်တူတယ်။ Case တစ်ခု ကျန်ခဲ့ရင် compiler က သတိပေးတယ်။

### 3. Postgres `numeric` → string
`numeric(12,2)` ကို Supabase က JSON မှာ string (`"0.80"`) နဲ့ ပို့နိုင်တယ်။ JavaScript number က ဒဿမကို အတိအကျ မသိမ်းနိုင်လို့ ဖြစ်တယ်။ ဒါကြောင့် `Number(p.cost_price)` နဲ့ ပြောင်းတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `double.parse(json['cost_price'].toString())` လုပ်ရတာနဲ့ အတူတူပဲ။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. Low-stock level 10 ရှိတဲ့ product က stock 11 ကနေ `out` 1 ခု ထည့်ရင် status ဘာဖြစ်မလဲ။ ဘယ်သူက status ကို ပြောင်းပေးတာလဲ။
2. `status` ကို database မှာ မတွက်ဘဲ React မှာ `p.stock_quantity <= p.low_stock_level` နဲ့ တွက်ရင် "Low stock product တွေကိုပဲ ပြ (page 10 ခုစီ)" ဆိုတဲ့ feature မှာ ဘာပြဿနာ ဖြစ်မလဲ။
3. `cost_price` ကို column grant မှာ မထည့်ခဲ့ရင် Edit form မှာ Save နှိပ်တဲ့အခါ ဘာဖြစ်မလဲ။
