# Phase 16 — Stock History

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**ရလဒ်:** **Stock history** page (`/history`) က ဆိုင်ရဲ့ stock movement အားလုံးကို နောက်ဆုံးဟာ အရင်ပြတယ်:

| Date | Product | Type | Qty | Note | By |
|---|---|---|---|---|---|
| 30 Oct 2026, 14:05 | Cola 330ml can BEV-101 | In | +10 | Delivery | owner@… |

- Filter: product၊ type (In/Out/Adjustment)၊ ရက်စွဲ (From – To)။ URL မှာ သိမ်းတယ်။
- Page တစ်ခုမှာ ၁၀ ခု ပြတယ် (Products page နဲ့ အတူတူ)။
- Product နာမည်ကို နှိပ်ရင် Products page မှာ အဲဒီ SKU နဲ့ ရှာပေးတယ်။
- Owner ရော staff ပါ ကြည့်လို့ရတယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **"ဘယ်သူ" ကို `created_by_email` column မှာ email အဖြစ် သိမ်းတယ်။**
  - `memberships` ထဲက email ကို ရှာပြီး ပြရင် owner က staff ကို ဖယ်လိုက်တဲ့အခါ membership row ပျက်သွားမယ်။ အဲဒီ staff ရဲ့ movement တွေမှာ "ဘယ်သူလဲ မသိ" ဖြစ်သွားမယ်။
  - Stock history က audit log (စစ်ဆေးရေး မှတ်တမ်း) ဖြစ်လို့ "ဘယ်သူ လုပ်ခဲ့လဲ" ဆိုတာ ဘယ်တော့မှ မပျောက်သင့်ဘူး။
  - Default က `auth.jwt() ->> 'email'` ဖြစ်တယ်။ Login token ထဲက email ကို database ကိုယ်တိုင် ယူတယ်။ App က ဒီ column ကို ရေးခွင့် မရှိလို့ (column grant မှာ မပါ) အတုလုပ်လို့ မရဘူး။
  - Phase 16 မတိုင်ခင်က movement တွေကို `memberships` ကနေ တစ်ခါ ဖြည့်ပေးခဲ့တယ်။ Seed ရဲ့ "Opening stock" movement တွေက SQL Editor ကနေ ထည့်ခဲ့လို့ user မရှိဘူး။ ဒါကြောင့် "—" ပြတယ်။
- **Index `(org_id, created_at desc)`:** "ကိုယ့်ဆိုင်ရဲ့ movement တွေ၊ နောက်ဆုံးဟာ အရင်" ဆိုတဲ့ query အတွက် ဖြစ်တယ်။ Movement တွေ ထောင်ချီ ရှိလာတဲ့အခါ table တစ်ခုလုံးကို မစီဘဲ index ကနေ တန်းယူတယ်။
- **ရက်စွဲ filter မှာ local time ကို သုံးတယ်။** Database က UTC နဲ့ သိမ်းတယ်။ မြန်မာ (UTC+6:30) မှာ "30 Oct" ဆိုတာ UTC 29 Oct 17:30 ကနေ စတယ်။ ဒါကြောင့် browser မှာ "30 Oct 00:00 (local)" ကို ISO timestamp ပြောင်းပြီးမှ ပို့တယ်။ "To" ရက်က အဲဒီနေ့ တစ်နေ့လုံး ပါအောင် "နောက်နေ့ 00:00 မတိုင်ခင်" (`lt`) လို့ ရှာတယ်။
- **Qty ကို `+` / `−` နဲ့ ပြတယ်။** Database မှာ `out` 5 ကို `5` (အပေါင်း) နဲ့ သိမ်းတယ်။ ဖတ်ရ လွယ်အောင် `−5` လို့ ပြောင်းပြတယ်။

## File တစ်ခုချင်းစီ

**`supabase/schema.sql` (section 4 ပြင်တယ်)**
`created_by_email` column၊ movement ဟောင်းတွေကို ဖြည့်တဲ့ update နဲ့ index အသစ် ပါတယ်။

**`src/services/movements.ts` (အသစ်)**
`listHistory(page, size, filters)` က product နာမည်ပါတဲ့ movement တွေကို page လိုက် ယူတယ်။ `startOfDay` / `startOfNextDay` က local ရက်စွဲကို timestamp ပြောင်းတယ်။

**`src/pages/HistoryPage.tsx` (အသစ်)**
Table၊ filter ၄ ခု၊ pagination ပါတယ်။ URL ကို ဖတ်တဲ့ `parsePage`၊ `parseType`၊ `parseDate` က မှားနေတဲ့ တန်ဖိုးတွေကို လျစ်လျူရှုတယ်။

**`src/components/Pagination.tsx` (ပြင်တယ်)**
`itemLabel` prop ထည့်တယ် ("products" အစား "movements" လို့ ပြလို့ရအောင်)။

**`src/App.tsx`၊ `src/types.ts` (ပြင်တယ်)၊ `src/pages/PlaceholderPage.tsx` (ဖျက်တယ်)**
`/history` route ကို ချိတ်တယ်။ Placeholder page တွေ မကျန်တော့လို့ `PlaceholderPage` ကို ဖျက်လိုက်တယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Audit log ဒီဇိုင်း
- Row တွေကို ဘယ်တော့မှ မပြင်၊ မဖျက်ဘူး (Phase 5 ကတည်းက update/delete policy မထားဘူး)။
- "ဘယ်သူ၊ ဘယ်အချိန်" ကို database ကိုယ်တိုင် ဖြည့်တယ် (`default auth.uid()`၊ `default now()`၊ `default auth.jwt() ->> 'email'`)။
- တခြား table ပြောင်းသွားရင်တောင် မှတ်တမ်း မပြောင်းအောင် တန်ဖိုးကို ကူးသိမ်းတယ် (email)။

### 2. Timezone နဲ့ ရက်စွဲ
`new Date('2026-10-30T00:00:00')` (timezone မပါ) ကို browser က local time အဖြစ် ယူတယ်။ `.toISOString()` က UTC (`2026-10-29T17:30:00.000Z`) ပြောင်းပေးတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `DateTime(2026, 10, 30).toUtc().toIso8601String()` နဲ့ အတူတူပဲ။

### 3. Prop ကို default value နဲ့ ထပ်ထည့်ခြင်း
`Pagination` ကို `itemLabel = 'products'` default နဲ့ ပြင်တယ်။ Products page က ဘာမှ ပြင်စရာ မလိုဘဲ ဆက်အလုပ်လုပ်တယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `{String itemLabel = 'products'}` named parameter default နဲ့ အတူတူပဲ။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. Email ကို `memberships` ကနေ join လုပ်ပြီး ပြခဲ့ရင် staff တစ်ယောက်ကို Remove လုပ်ပြီးနောက် သူ့ movement တွေမှာ ဘာဖြစ်မလဲ။
2. "To = 30 Oct" filter မှာ `lte('created_at', '2026-10-30')` လို့ ရေးခဲ့ရင် 30 Oct နေ့လယ် ၂ နာရီက movement ပါမလား။ ဘာကြောင့်လဲ။
3. Staff က console ကနေ `created_by_email` ကို တခြားသူ email နဲ့ ထည့်ကြည့်ရင် ဘာဖြစ်မလဲ။ ဘယ်နေရာက တားတာလဲ။
