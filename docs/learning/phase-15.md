# Phase 15 — CSV Export

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**ရလဒ်:** Products page ရဲ့ အပေါ်မှာ **Export CSV** ခလုတ် ရှိလာတယ်။
- လက်ရှိ filter (search၊ category၊ supplier၊ status) နဲ့ ကိုက်တဲ့ product **အားလုံး**ကို download လုပ်တယ်။ လက်ရှိ page ရဲ့ ၁၀ ခုတည်း မဟုတ်ဘူး။
- File နာမည်က `products-2026-10-30.csv` ဖြစ်တယ်။ Excel ဒါမှမဟုတ် Google Sheets မှာ ဖွင့်လို့ရတယ်။
- Owner ရော staff ပါ သုံးလို့ရတယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **တစ်ခါ row ၁၀၀၀ စီ ယူတယ်။** Supabase က request တစ်ခုမှာ row ၁၀၀၀ ထက် ပိုမပေးဘူး။ Product ၂၅၀၀ ရှိရင် `range(0, 999)`၊ `range(1000, 1999)`၊ `range(2000, 2999)` ဆိုပြီး ၃ ခါ ယူတယ်။ ၁၀၀၀ ထက် နည်းတဲ့ အပိုင်း ရောက်ရင် ရပ်တယ်။
- **`order('name').order('id')` ကို အမြဲ သုံးတယ်။** အစီအစဉ် မသတ်မှတ်ရင် database က အပိုင်းတိုင်းမှာ အစီအစဉ် ပြောင်းနိုင်တယ်။ ဒါကြောင့် row တချို့ နှစ်ခါ ပါလာနိုင်တယ်၊ တချို့ ပျောက်နိုင်တယ်။
- **CSV ကို library မသုံးဘဲ ကိုယ်တိုင် ရေးတယ်။** စည်းကမ်း ၃ ခုပဲ ရှိတယ်:
  1. Comma၊ quote ဒါမှမဟုတ် line break ပါရင် `"…"` နဲ့ ထုပ်တယ်။
  2. အထဲက `"` ကို `""` (နှစ်ခု) ပြောင်းတယ်။ `Cola, "Large"` → `"Cola, ""Large"""`
  3. Line တွေကို `\r\n` နဲ့ ခွဲတယ် (Excel ရဲ့ ပုံမှန်)။
- **CSV injection ကို ကာကွယ်တယ်။** Product နာမည်က `=SUM(...)` လို `=` နဲ့ စရင် Excel က formula အဖြစ် run တယ်။ အန္တရာယ်ရှိတဲ့ formula တွေ (ဥပမာ link ဖွင့်ခိုင်းတာ) လည်း ဖြစ်နိုင်တယ်။ ဒါကြောင့် `= + - @` နဲ့ စတဲ့ စာတွေရဲ့ ရှေ့မှာ `'` ထည့်ပြီး ရိုးရိုးစာ ဖြစ်အောင် လုပ်တယ်။
- **UTF-8 BOM (`﻿`) ကို file အစမှာ ထည့်တယ်။** BOM မပါရင် Excel က file ကို encoding ဟောင်းနဲ့ ဖတ်ပြီး **မြန်မာစာ** တွေ `á€€á€±á€¬` လို ပျက်ပြီး ပေါ်တယ်။

## File တစ်ခုချင်းစီ

**`src/lib/csv.ts` (အသစ်)**
`toCsv(rows)` က array တွေကို CSV စာသား ပြောင်းတယ် (quote နဲ့ injection ကာကွယ်မှု ပါတယ်)။ `downloadCsv(filename, csv)` က browser မှာ file download ဖြစ်အောင် လုပ်တယ်။

**`src/services/products.ts` (ပြင်တယ်)**
`listAllProducts(filters)` က ၁၀၀၀ စီ loop ပတ်ပြီး product အားလုံးကို ယူတယ်။ `PRODUCT_COLUMNS` နဲ့ `toProducts()` ကို `listProducts` နဲ့ မျှသုံးတယ်။

**`src/pages/ProductsPage.tsx` (ပြင်တယ်)**
Export CSV ခလုတ် ထည့်တယ်။ Export လုပ်နေတုန်း "Exporting…" ပြတယ်။ Product မရှိရင် ခလုတ် ပိတ်ထားတယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Blob နဲ့ file download
Server မလိုဘဲ browser ထဲမှာ file ဖန်တီးတယ်:
1. `new Blob([text])` က memory ထဲမှာ file တစ်ခု ဖန်တီးတယ်။
2. `URL.createObjectURL(blob)` က အဲဒီ file အတွက် ယာယီ URL (`blob:…`) ပေးတယ်။
3. `<a download="name.csv">` ကို code ကနေ click လုပ်ခိုင်းတယ်။
4. ပြီးရင် `revokeObjectURL` နဲ့ memory ကို ပြန်လွှတ်တယ်။

**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** Mobile မှာ `path_provider` နဲ့ file ရေးပြီး `share_plus` နဲ့ မျှဝေရတယ်။ Flutter Web မှာတော့ ဒီ Blob နည်းကိုပဲ သုံးရတယ်။

### 2. Pagination loop (`for (let from = 0; ; from += 1000)`)
အဆုံးမသိတဲ့ loop ဖြစ်တယ်။ ရလာတဲ့ row အရေအတွက်က ၁၀၀၀ ထက် နည်းရင် `return` နဲ့ ထွက်တယ်။ `await` ကို loop ထဲမှာ သုံးလို့ request တွေက တစ်ခုပြီးမှ တစ်ခု သွားတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `for (var from = 0; ; from += 1000) { final rows = await fetch(from); all.addAll(rows); if (rows.length < 1000) break; }` နဲ့ အတူတူပဲ။

### 3. Spread (`...`) နဲ့ array ပေါင်းခြင်း
`[header, ...all.map(…)]`: header row တစ်ခုနဲ့ product row တွေကို array တစ်ခုတည်း ဖြစ်အောင် ပေါင်းတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `[header, ...all.map(...)]` ဆိုပြီး Dart မှာလည်း အတူတူ ရေးလို့ရတယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. Product ၂၅၀၀ ရှိတဲ့ ဆိုင်မှာ Export နှိပ်ရင် database ကို request ဘယ်နှခု ပို့မလဲ။ ဘယ်အချိန် loop ရပ်မလဲ။
2. Product နာမည် `Cola, "Large"` ကို quote မထုပ်ဘဲ CSV ထဲ ထည့်ရင် Excel မှာ ဘယ်လို ပေါ်မလဲ။
3. Product နာမည်ကို `=HYPERLINK("http://bad.example","Click")` လို့ ပေးထားရင် `'` မထည့်ဘဲ export လုပ်တဲ့အခါ ဘာအန္တရာယ် ရှိလဲ။
