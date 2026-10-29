# Phase 7 — Owner / Staff ခွင့်ပြုချက် ခွဲခြားခြင်း

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

| | Owner | Staff |
|---|---|---|
| Product၊ category၊ stock history ကြည့်ခြင်း | ✅ | ✅ |
| Stock in/out/adjustment မှတ်ခြင်း | ✅ | ✅ |
| Product ထည့်/ပြင်/ဖျက်၊ ပုံ upload | ✅ | ❌ |
| Category ထည့်/ပြင်/ဖျက် | ✅ | ❌ |
| Settings (member၊ invite code) | ✅ | ❌ |

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **နှစ်နေရာမှာ ပိတ်တယ်: UI နဲ့ database။**
  - UI မှာ ခလုတ်ဖျောက်တာက staff မျက်စိရှုပ်မှာစိုးလို့ပဲ ဖြစ်တယ်။ လုံခြုံရေးအတွက် မဟုတ်ဘူး။ Browser ထဲက code ကို သုံးသူက ပြင်လို့ရတယ် (console ကနေ function ကို တိုက်ရိုက် ခေါ်လို့ရတယ်)။
  - တကယ့် လုံခြုံရေးက database ရဲ့ RLS policy ဖြစ်တယ်။ Policy တိုင်းမှာ `and is_owner()` ထပ်ထည့်ထားတယ်။
- **Read policy ကို မပြောင်းဘူး။** Staff လည်း product တွေကို မြင်ရမှ stock မှတ်လို့ရမယ်။
- **`stock_movements` insert ကို member အားလုံး ခွင့်ပြုထားတယ်။** Staff ရဲ့ အဓိက အလုပ်က stock in/out မှတ်တာ ဖြစ်လို့ ဖြစ်တယ်။
- **Policy နာမည်ကို `members: …` ကနေ `owners: …` ပြောင်းတယ်။** နာမည်ကြည့်ရုံနဲ့ ဘယ်သူ လုပ်ခွင့်ရှိလဲ သိရတယ်။ နာမည်ဟောင်းတွေကို `drop policy if exists` နဲ့ ဖျက်တယ်။ ဒီလို မဖျက်ရင် policy ဟောင်း ("member မှန်ရင် ရတယ်") ကျန်နေမယ်။ Policy တွေက OR နဲ့ ပေါင်းလို့ staff လည်း ဆက်ပြင်လို့ ရနေမယ်။
- **ပုံ upload/ဖျက်တာကိုလည်း owner ပဲ လုပ်ခွင့်ရှိတယ်** (storage policy)။
- **Update/delete အတွက် `requireChanged()` ထည့်တယ်။** RLS က update/delete ကို ပိတ်တဲ့အခါ error မပြဘဲ row ၀ ခုကိုပဲ ပြင်တယ်။ ဒီ helper မရှိရင် staff ရဲ့ Delete က "အောင်မြင်တယ်" လို့ ထင်ရပေမယ့် တကယ်တော့ ဘာမှ မပျက်ဘူး။ ဒါကြောင့် `.select()` နဲ့ ပြောင်းသွားတဲ့ row တွေကို ပြန်ယူတယ်။ ၀ ခု ဖြစ်နေရင် error ပြတယ်။

## File တစ်ခုချင်းစီ

**`supabase/schema.sql` (section 6 နဲ့ 7 ပြင်တယ်)**
Product နဲ့ category ကို ထည့်၊ ပြင်၊ ဖျက်တဲ့ policy တွေ၊ ပုံ upload/ဖျက်တဲ့ policy တွေမှာ `is_owner()` ထည့်တယ်။

**`src/shop/ShopContext.ts` (ပြင်တယ်)**
`useRole()` hook အသစ် ထည့်တယ်။ `{ role, isOwner }` ကို ပြန်ပေးတယ်။

**`src/components/RequireOwner.tsx` (အသစ်)**
Staff က `/settings` ကို URL ရိုက်ပြီး ဖွင့်ရင် `/dashboard` ကို ပြန်ပို့တယ်။

**`src/services/errors.ts` (ပြင်တယ်)**
`requireChanged(rows)` helper ထည့်တယ်။ Row ၀ ခုဆိုရင် "Nothing was changed. Only the shop owner can do this…" ဆိုတဲ့ error ပြတယ်။

**`src/services/products.ts`၊ `categories.ts`၊ `members.ts` (ပြင်တယ်)**
Update/delete တိုင်းမှာ `.select()` နဲ့ `requireChanged()` ကို သုံးတယ်။

**`ProductsPage.tsx`၊ `CategoriesPage.tsx`၊ `Sidebar.tsx`၊ `SettingsPage.tsx`၊ `App.tsx` (ပြင်တယ်)**
Staff အတွက် Add/Edit/Delete/Rename ခလုတ်တွေနဲ့ Settings link ကို ဖျောက်တယ်။ Stock ခလုတ်ကတော့ ကျန်တယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Client-side check ≠ Security
UI မှာ ခလုတ်ဖျောက်တာက "ပြသခြင်း" ပဲ ဖြစ်တယ်။ Browser ထဲက JavaScript ကို user က အမြဲ ပြင်လို့ရတယ်။ ဒါကြောင့် စည်းကမ်းကို server (ဒီမှာတော့ database) မှာ စစ်ရမယ်။
**Flutter/Firebase နဲ့ နှိုင်းယှဉ်ရင်:** Flutter app မှာ `if (isOwner) ElevatedButton(...)` ရေးထားပေမယ့် Firestore Security Rules မှာ မစစ်ရင် တခြား client ကနေ ရေးလို့ရနေမှာ ဖြစ်တယ်။ ဒီမှာလည်း အတူတူပဲ။

### 2. Custom hook က တခြား hook ကို ပြန်သုံးခြင်း
`useRole()` က `useShop()` ကို ခေါ်ပြီး ရလဒ်ကို လွယ်အောင် ပြောင်းပေးတယ်။ Hook တွေကို ဒီလို ပေါင်းစပ်လို့ရတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** Riverpod မှာ `final isOwnerProvider = Provider((ref) => ref.watch(shopProvider)?.role == Role.owner);` လို provider တစ်ခုက နောက် provider တစ်ခုကို watch လုပ်တာနဲ့ ဆင်တူတယ်။

### 3. Layout route နဲ့ guard (`<RequireOwner />`)
`{ element: <RequireOwner />, children: [...] }` က path မရှိတဲ့ route ဖြစ်တယ်။ သူ့အောက်က page တွေကို ဖွင့်ခင် စစ်ပေးတယ်။ နောက်ထပ် owner-only page တွေ ထပ်ထည့်ချင်ရင် `children` ထဲ ထည့်လိုက်ရုံပဲ။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** GoRouter ရဲ့ `ShellRoute` + `redirect` နဲ့ ဆင်တူတယ်။

### 4. Policy တွေက OR နဲ့ ပေါင်းတယ်
Table တစ်ခုမှာ insert policy နှစ်ခု ရှိရင် တစ်ခုခု မှန်တာနဲ့ ခွင့်ပြုတယ်။ ဒါကြောင့် စည်းကမ်းကို တင်းကျပ်အောင် လုပ်ချင်ရင် policy ဟောင်းကို **ဖျက်ရမယ်**။ ပြီးမှ အသစ် ထည့်ရမယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. ProductsPage မှာ Delete ခလုတ်ကို ဖျောက်ထားရုံနဲ့ ဘာကြောင့် မလုံလောက်တာလဲ။ Staff က ဘယ်လို ကျော်လို့ရနိုင်လဲ။
2. `schema.sql` မှာ `drop policy if exists "members: add products"` မပါဘဲ `owners: add products` ကိုပဲ ထည့်ခဲ့ရင် staff က product ထည့်လို့ ရနေသေးလား။ ဘာကြောင့်လဲ။
3. Staff က console ကနေ `deleteProduct(id)` ကို ခေါ်တဲ့အခါ database က error မပြဘဲ ဘာပြန်ပေးလဲ။ App မှာ ဘယ်နေရာက error ပြတာလဲ။
