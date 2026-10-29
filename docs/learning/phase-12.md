# Phase 12 — Products pagination (စာမျက်နှာ ခွဲပြခြင်း)

> Roadmap မှာ Phase 12 ဖြစ်ပေမယ့် Phase 2 ပြီးတာနဲ့ စောစောလုပ်ခဲ့တယ်။ Phase 3–11 နဲ့ မဆိုင်လို့ အစီအစဉ် ပြောင်းလုပ်လို့ ရတာ ဖြစ်တယ်။

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

- Products table မှာ **တစ်မျက်နှာကို product ၁၀ ခု** ပြပြီး Previous / Next ခလုတ်တွေနဲ့ ရွှေ့လို့ ရတယ်။
- **Server-side pagination:** Database ကနေ လက်ရှိ page အတွက် ၁၀ ကြောင်းနဲ့ စုစုပေါင်း အရေအတွက် (`count`) ပဲ ပို့ပေးတယ်။ Product ၁၀,၀၀၀ ရှိလည်း browser က ၁၀ ကြောင်းပဲ download လုပ်ရလို့ မြန်တယ်။ (Client-side pagination ဆိုရင် အကုန် download လုပ်ပြီးမှ browser ထဲမှာ ခွဲပြတာ ဖြစ်လို့ data များလာရင် နှေးတယ်။)
- **Page နံပါတ်ကို URL ထဲမှာ ထားတယ်** (`/products?page=2`)။ Refresh လုပ်လည်း၊ link ကို တခြားသူဆီ ပို့လည်း၊ Back နှိပ်လည်း page မှန်မှန် ပြတယ်။ `useState` ထဲမှာပဲ ထားရင် refresh လုပ်တာနဲ့ page 1 ကို ပြန်ရောက်သွားမယ်။
- **`name` ပြီးရင် `id` နဲ့ ထပ်စီတယ်။** နာမည်တူတဲ့ product ၂ ခုရှိရင် database က ဘယ်ဟာ အရင်ပြမလဲ အမြဲ တူမှာ မဟုတ်ဘူး။ ဒါကြောင့် product တစ်ခုက page ၂ ခုမှာ ထပ်ပေါ်တာ၊ ပျောက်သွားတာ ဖြစ်နိုင်တယ်။ `id` နဲ့ ထပ်စီရင် အစီအစဉ် အမြဲ တူတယ်။
- **မှားနေတဲ့ URL ကို အလိုအလျောက် ပြင်တယ်။** `?page=99` ဆိုရင် နောက်ဆုံး page ကို ပို့တယ်။ `?page=abc` ဆိုရင် page 1 ကို ပို့တယ်။ နောက်ဆုံး page ရဲ့ နောက်ဆုံး product ကို ဖျက်ရင် တစ်မျက်နှာ နောက်ပြန်ဆုတ်တယ်။
- **Page ပြောင်းနေတုန်း** table အဟောင်းကို မှိန်မှိန်လေး ဆက်ပြထားတယ်။ "Loading…" နဲ့ အစားထိုးလိုက်ရင် စာမျက်နှာ ခုန်သွားလို့ ပြဿနာ ဖြစ်တယ်။

## File တစ်ခုချင်းစီ

**`src/services/products.ts` (ပြင်တယ်)**
`listProducts(page, pageSize)` က `{ products, total }` ကို ပြန်ပေးတယ်။ `.range(from, to)` နဲ့ လိုတဲ့ ကြောင်းပဲ ယူပြီး `count: 'exact'` နဲ့ စုစုပေါင်း အရေအတွက်ပါ တစ်ခါတည်း ယူတယ်။ Page က အဆုံးကို ကျော်သွားရင် Supabase က `PGRST103` error ပြန်ပေးတယ်။ အဲ့ဒီအခါ row မယူဘဲ အရေအတွက်ပဲ ပြန်ယူတယ်။

**`src/components/Pagination.tsx` (အသစ်)**
"Showing 11–20 of 22 products" စာနဲ့ Previous / Next ခလုတ်တွေ ပါတယ်။ ပထမ page မှာ Previous ကို၊ နောက်ဆုံး page မှာ Next ကို နှိပ်လို့ မရအောင် (disabled) လုပ်ထားတယ်။ Data မယူဘူး၊ props နဲ့ ပြရုံပဲ ပြတယ်။ ဒါကြောင့် Phase 16 က Stock history page မှာလည်း ပြန်သုံးလို့ ရတယ်။

**`src/pages/ProductsPage.tsx` (ပြင်တယ်)**
URL ထဲက `?page=` ကို ဖတ်ပြီး page ပြောင်းတိုင်း data ပြန်ယူတယ်။ Header မှာ product အရေအတွက်ကို ဒီ page မှာ ပါတဲ့ အရေအတွက် မဟုတ်ဘဲ စုစုပေါင်း (`total`) ပြတယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. `.range(from, to)` — offset pagination
Page 2၊ page size 10 ဆိုရင် `from = (2 - 1) × 10 = 10`၊ `to = 19` ဖြစ်တယ်။ ရေတွက်တာ 0 ကနေ စတယ်။ `to` က ပါဝင်တယ် (inclusive)၊ ဒါကြောင့် `from + pageSize - 1` ဖြစ်တယ်။
**SQL နဲ့ ဆိုရင်:** `... order by name, id limit 10 offset 10`။

### 2. `count: 'exact'`
Row တွေနဲ့အတူ "စုစုပေါင်း ဘယ်နှခုလဲ" ကိုပါ တစ်ခါတည်း ယူတယ်။ ဒါမှ "Page 2 of 3" ကို တွက်လို့ ရတယ်။ `lastPage = Math.ceil(total / pageSize)` (၂၂ ÷ ၁၀ = ၂.၂ → ၃)။

### 3. URL ကို state အဖြစ် သုံးခြင်း (`useSearchParams`)
`useSearchParams()` က `useState` နဲ့ ဆင်တူတယ်။ မတူတာက value ကို URL ထဲမှာ သိမ်းတာပဲ။ `setSearchParams({ page: '2' })` ခေါ်ရင် URL ပြောင်းပြီး component ပြန် render ဖြစ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `go_router` မှာ `state.uri.queryParameters['page']` နဲ့ ဖတ်ပြီး `context.go('/products?page=2')` နဲ့ ပြောင်းတာနဲ့ တူတယ်။

### 4. `useEffect` ရဲ့ dependency `[page]`
`[page]` ထည့်ထားလို့ page ပြောင်းတိုင်း effect ပြန် run ပြီး data အသစ် ယူတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `didUpdateWidget` ထဲမှာ `if (oldWidget.page != widget.page) fetch();` ရေးတာနဲ့ တူတယ်။

### 5. Cleanup နဲ့ `ignore` flag (race condition ကာကွယ်ခြင်း)
Next ကို မြန်မြန် ၂ ခါ နှိပ်ရင် request ၂ ခု ထွက်သွားတယ်။ Page 2 ရဲ့ request က page 3 ထက် နောက်ကျပြီး ရောက်လာရင် page 3 မှာ page 2 ရဲ့ data ပေါ်နေမယ်။ Effect ရဲ့ `return () => { ignore = true }` (cleanup) က အဟောင်း request ရဲ့ အဖြေကို လျစ်လျူရှုခိုင်းတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `await` ပြီးရင် `if (!mounted) return;` စစ်တာနဲ့ ဆင်တူတယ်။ ဒါမှမဟုတ် `StreamSubscription` ကို `cancel()` လုပ်တာနဲ့ တူတယ်။

### 6. Render ထဲမှာ `<Navigate />` နဲ့ redirect လုပ်ခြင်း
URL မှားနေရင် `useEffect` ထဲမှာ ပြင်မယ့်အစား render ထဲမှာ `<Navigate replace />` ကို တိုက်ရိုက် return ပြန်တယ်။ "ဒီ state ဆိုရင် ဒီ URL ဖြစ်ရမယ်" လို့ ကြေညာလိုက်တာ (declarative) ဖြစ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `go_router` ရဲ့ `redirect: (context, state) => ...` နဲ့ ဆင်တူတယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. Page size 10 ဖြစ်ပြီး product 22 ခုရှိရင် page 3 အတွက် `.range()` ထဲကို ဘယ်ဂဏန်း ၂ လုံး ထည့်မလဲ။ Page 3 မှာ product ဘယ်နှခု ပေါ်မလဲ။
2. Page နံပါတ်ကို `useState` ထဲမှာ မထားဘဲ URL (`?page=`) ထဲမှာ ဘာကြောင့် ထားတာလဲ။ အကျိုးကျေးဇူး ၂ ခု ပြောပါ။
3. `.order('id')` ကို ဖြုတ်လိုက်ရင် ဘယ်လို ပြဿနာ ဖြစ်နိုင်လဲ။
