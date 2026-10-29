# Phase 9 — Dashboard

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**ရလဒ်:** `/dashboard` မှာ card ၄ ခု ပေါ်တယ်:
- **Stock value** (ဝယ်ဈေး × stock၊ product အားလုံး ပေါင်း)
- **Products** (စုစုပေါင်း)
- **Low stock**
- **Out of stock**

Card တွေ အောက်မှာ **Stock status** bar ရှိတယ်။ အစိမ်း/အဝါ/အနီ အပိုင်းတွေကို product အရေအတွက်အလိုက် အကျယ်ခွဲထားတယ်။ အောက်မှာ legend (အရောင် + နာမည် + အရေအတွက် + %) ပါတယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **ဂဏန်းတွေကို database မှာ တွက်တယ် (`dashboard_summary()`)။** Product အားလုံးကို browser ထဲ download လုပ်ပြီး JavaScript နဲ့ ပေါင်းရင် product ၁ သောင်း ရှိတဲ့အခါ နှေးမယ်။ Database ကတော့ row ၅ ခုပါတဲ့ အဖြေ တစ်ကြောင်းတည်းကို ပြန်ပို့တယ်။
- **`security invoker` ကို သုံးတယ် (`definer` မဟုတ်ဘူး)။**
  - `invoker` ဆိုတာ ခေါ်တဲ့သူရဲ့ ခွင့်ပြုချက်နဲ့ run တာ ဖြစ်တယ်။ ဒါကြောင့် `products` ရဲ့ RLS ဆက်အလုပ်လုပ်ပြီး ကိုယ့်ဆိုင် product တွေကိုပဲ ရေတွက်တယ်။ Function ထဲမှာ `where org_id = ...` ရေးစရာ မလိုဘူး။
  - `definer` ဆိုရင် RLS ကို ကျော်သွားမယ်။ ဆိုင်အားလုံးရဲ့ product တွေကို ပေါင်းမိမယ်။
  - `create_organization` မှာ `definer` လိုတာက user က `organizations` ထဲ တိုက်ရိုက် ရေးခွင့် မရှိလို့ ဖြစ်တယ်။ ဒီမှာတော့ ဖတ်ခွင့် ရှိပြီးသား ဖြစ်လို့ `invoker` နဲ့ လုံလောက်တယ်။ လုံခြုံလည်း ပိုလုံခြုံတယ်။
- **Aggregate (`count`, `sum`) ကို `group by` မပါဘဲ သုံးတယ်။** Product မရှိရင်တောင် row တစ်ကြောင်း အမြဲ ပြန်ပေးတယ်။ `sum` က `null` ဖြစ်တာကို `coalesce(…, 0)` နဲ့ 0 ပြောင်းတယ်။ ဒါကြောင့် ဆိုင်အသစ်မှာ error မတက်ဘဲ 0 တွေ ပြတယ်။
- **Bar ကို library မသုံးဘဲ `div` တွေနဲ့ လုပ်တယ်။** အပိုင်းတစ်ခုစီရဲ့ အကျယ်က `count / total × 100%` ဖြစ်တယ်။ အကျယ်က data ပေါ် မူတည်လို့ Tailwind class နဲ့ မရဘူး။ ဒါကြောင့် `style={{ width }}` ကို သုံးရတယ်။ (Phase 1 က "inline style မသုံးရ" ဆိုတဲ့ စည်းကမ်းရဲ့ ခြွင်းချက် တစ်ခုတည်း ဖြစ်တယ်။)
- **အရောင်တစ်ခုတည်းနဲ့ အဓိပ္ပာယ် မပေးဘူး။** Legend မှာ နာမည်နဲ့ ဂဏန်း ပါတယ်။ Mouse တင်ရင် tooltip ပေါ်တယ်။ Screen reader အတွက် `aria-label` ပါတယ်။ အရောင်ခွဲမရတဲ့ သူတွေလည်း ဖတ်လို့ရတယ်။

## File တစ်ခုချင်းစီ

**`supabase/schema.sql` (section 9 ထည့်တယ်)**
`dashboard_summary()` function ဖြစ်တယ်။ Stock value၊ product အရေအတွက်၊ in/low/out အရေအတွက်ကို row တစ်ကြောင်းနဲ့ ပြန်ပေးတယ်။

**`src/services/dashboard.ts` (အသစ်)**
`getDashboardSummary()` က RPC ကို `.single()` နဲ့ ခေါ်တယ်။ `stock_value` ကို number ပြောင်းတယ်။

**`src/pages/DashboardPage.tsx` (အသစ်)**
Card ၄ ခု (`StatCard`)၊ status bar နဲ့ legend ပါတယ်။ Product မရှိရင် "No products yet" ပြတယ်။

**`src/App.tsx`၊ `src/types.ts` (ပြင်တယ်)**
`/dashboard` က placeholder အစား `DashboardPage` ကို ပြတယ်။ `DashboardSummary` type ထည့်တယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. `security invoker` နဲ့ `security definer`
| | invoker | definer |
|---|---|---|
| ဘယ်သူ့ ခွင့်ပြုချက်နဲ့ run လဲ | ခေါ်တဲ့သူ | Function ပိုင်ရှင် (postgres) |
| RLS | အလုပ်လုပ်တယ် | ကျော်တယ် |
| ဘယ်အချိန် သုံးလဲ | ဖတ်ရုံ၊ တွက်ရုံ | User တိုက်ရိုက် မလုပ်နိုင်တာကို ထိန်းချုပ်ပြီး လုပ်ပေးဖို့ |

### 2. `count(*) filter (where …)`
Query တစ်ခုတည်းမှာ အခြေအနေ အမျိုးမျိုးနဲ့ ရေတွက်လို့ရတယ်။ Query ၃ ခု သီးသန့် မလိုဘူး။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `products.where((p) => p.status == 'low').length` လိုပဲ။ ဒါပေမယ့် database ထဲမှာ run လို့ data ကို download လုပ်စရာ မလိုဘူး။

### 3. `.rpc(...).single()`
`returns table` function က row array ကို ပြန်ပေးတယ်။ `.single()` က "row တစ်ကြောင်းပဲ ရှိရမယ်" လို့ ပြောပြီး array မဟုတ်ဘဲ object တစ်ခုကို ပြန်ပေးတယ်။

### 4. Component ထဲက သေးငယ်တဲ့ component (`StatCard`)
Card ၄ ခုက ပုံစံတူတယ်။ ဒါကြောင့် props (`label`, `value`, `hint`, `dot`) နဲ့ component တစ်ခု လုပ်ပြီး ပြန်သုံးတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `StatCard(label: 'Products', value: '20')` ဆိုတဲ့ `StatelessWidget` တစ်ခု လုပ်တာနဲ့ အတူတူပဲ။ Optional prop (`hint?`) က Dart ရဲ့ `String? hint` နဲ့ တူတယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. `dashboard_summary()` ကို `security definer` လုပ်ခဲ့ရင် dashboard မှာ ဘယ်ဂဏန်းတွေ ပေါ်မလဲ။ ဘာကြောင့်လဲ။
2. Product တစ်ခုမှ မရှိတဲ့ ဆိုင်မှာ `sum(cost_price * stock_quantity)` က ဘာပြန်ပေးလဲ။ `coalesce` မပါရင် React မှာ ဘာဖြစ်နိုင်လဲ။
3. Bar ရဲ့ အကျယ်ကို ဘာကြောင့် Tailwind class (`w-1/2` လို) နဲ့ မလုပ်ဘဲ `style={{ width }}` နဲ့ လုပ်ရတာလဲ။
