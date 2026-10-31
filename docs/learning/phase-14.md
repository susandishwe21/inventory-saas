# Phase 14 — Status filter

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**ရလဒ်:**
- Products page မှာ **Status** select (All / In stock / Low stock / Out of stock) ပါလာတယ်။
- Filter ၄ မျိုး (search၊ category၊ supplier၊ status) ကို တွဲသုံးလို့ရတယ်။ ဥပမာ: "Snacks ထဲက Low stock ဖြစ်နေတာတွေ"။
- Filter အားလုံးဟာ URL ထဲမှာ ရှိတယ်: `/products?category=…&status=low&q=choc`။
- Dashboard ရဲ့ **Low stock** / **Out of stock** card ကို နှိပ်ရင် အဲဒီ product တွေကို တန်းပြတယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **Phase 8 ရဲ့ generated column ကို ပြန်သုံးတယ်။** `status` က database ထဲမှာ ရှိပြီးသား ဖြစ်လို့ `.eq('status', 'low')` တစ်ကြောင်းနဲ့ ရတယ်။ Database ပြောင်းစရာ မလိုဘူး။ Phase 8 မှာ "status ကို React မှာ မတွက်ဘဲ database မှာ တွက်" လို့ ဆုံးဖြတ်ခဲ့တာရဲ့ အကျိုး ဖြစ်တယ်။
- **Filter တွေကို AND နဲ့ ပေါင်းတယ်။** Supabase query ကို `query = query.eq(...)` နဲ့ အဆင့်ဆင့် ထပ်ထည့်တယ်။ Filter တစ်ခုစီက ရလဒ်ကို ပိုကျဉ်းအောင် လုပ်တယ်။
- **URL ထဲက status ကို စစ်တယ် (`parseStatus`)။** User က `?status=abc` လို့ ရိုက်ရင် database error မတက်ဘဲ "All" အဖြစ် ယူတယ်။ URL က user ပြင်လို့ရတဲ့ input ဖြစ်လို့ မယုံရဘူး။
- **Dashboard card ကို link လုပ်တယ်။** "Low stock 5" ကို မြင်ရင် "ဘယ်ဟာတွေလဲ" လို့ ချက်ချင်း သိချင်တယ်။ Filter ကို URL မှာ ထားခဲ့လို့ link တစ်ခုနဲ့ ဖွင့်လို့ရတယ်။

## File တစ်ခုချင်းစီ

**`src/services/products.ts` (ပြင်တယ်)**
`ProductFilters` မှာ `status` ထည့်တယ်။ `.eq('status', …)` နဲ့ filter လုပ်တယ်။

**`src/pages/ProductsPage.tsx` (ပြင်တယ်)**
Status select၊ `parseStatus()`၊ header မှာ "· Low stock"၊ Clear filters က status ကိုလည်း ရှင်းတယ်။

**`src/pages/DashboardPage.tsx` (ပြင်တယ်)**
`StatCard` မှာ `to` prop ထည့်တယ်။ `to` ပါရင် card က `<Link>` ဖြစ်သွားပြီး mouse တင်ရင် "View products →" ပေါ်တယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. URL ကို state အဖြစ် သုံးခြင်း
Filter ၄ ခုလုံးကို `useState` မှာ မထားဘဲ URL (`useSearchParams`) မှာ ထားတယ်။ အကျိုးကျေးဇူး:
- Reload လုပ်ရင် မပျောက်ဘူး
- Back ခလုတ် အလုပ်လုပ်တယ်
- Link ကို တခြားသူကို ပို့လို့ရတယ်
- Dashboard ကနေ filter လုပ်ပြီးသား page ကို ဖွင့်လို့ရတယ်

**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** GoRouter မှာ `state.uri.queryParameters['status']` ကို ဖတ်ပြီး `context.go('/products?status=low')` နဲ့ ပြောင်းတာနဲ့ အတူတူပဲ။

### 2. Conditional wrapper (`to` ပါရင် Link၊ မပါရင် div)
`StatCard` က အတွင်းပိုင်း (`content`) ကို တစ်ခါပဲ ရေးပြီး `to` ရှိ/မရှိ ပေါ်မူတည်ပြီး `<Link>` ဒါမှမဟုတ် `<div>` နဲ့ ထုပ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `onTap != null ? InkWell(onTap: onTap, child: content) : content` နဲ့ ဆင်တူတယ်။

### 3. Type guard အသေး (`parseStatus`)
`string | null` ကို `StockStatus | null` ဖြစ်အောင် စစ်ပြီးမှ ပြောင်းတယ်။ `as StockStatus` ကို စစ်ပြီးမှ သုံးလို့ လုံခြုံတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `StockStatus.values.asNameMap()[raw]` (မတွေ့ရင် `null`) နဲ့ ဆင်တူတယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. Status filter အတွက် database ကို ဘာကြောင့် ပြင်စရာ မလိုတာလဲ။
2. `/products?status=abc` ကို ဖွင့်ရင် ဘာဖြစ်မလဲ။ `parseStatus` မပါရင်ရော ဘာဖြစ်နိုင်လဲ။
3. Filter တွေကို `useState` မှာ ထားရင် Dashboard ရဲ့ "Low stock" card ကနေ filter လုပ်ပြီးသား Products page ကို ဘာကြောင့် ဖွင့်ရ ခက်မလဲ။
