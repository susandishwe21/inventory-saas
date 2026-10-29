# Phase 4 — ဆိုင် (Organization) နဲ့ Onboarding

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**Workflow:**
1. User အသစ် register/login ဝင်တယ်။
2. ဆိုင် မရှိသေးရင် `/onboarding` ကို အလိုအလျောက် ရောက်သွားတယ်။ "Create your shop" form မှာ ဆိုင်နာမည် ထည့်တယ်။
3. **Create shop** နှိပ်ရင် ဆိုင် ဖန်တီးပြီး အဲဒီ user က **owner** ဖြစ်သွားတယ်။ ပြီးရင် `/dashboard` ကို ရောက်တယ်။
4. Sidebar အပေါ်မှာ ဆိုင်နာမည် ပေါ်တယ်။ အောက်ခြေမှာ email နဲ့ role (Owner) ပေါ်တယ်။
5. ဆိုင် ရှိပြီးသား user က `/onboarding` ကို ဖွင့်ရင် `/dashboard` ကို ပြန်ပို့တယ်။ Onboarding က တစ်ခါပဲ ဖြစ်တယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **`memberships.user_id` ကို primary key လုပ်ထားတယ်။** ဒါကြောင့် user တစ်ယောက်မှာ membership row တစ်ခုပဲ ရှိနိုင်တယ်။ "ဆိုင် တစ်ဆိုင်ပဲ" ဆိုတဲ့ စည်းကမ်းကို app code က မဟုတ်ဘဲ database ကိုယ်တိုင် စောင့်ကြည့်တယ်။
- **ဆိုင် ဖန်တီးတာကို RPC function (`create_organization`) တစ်ခုတည်းနဲ့ လုပ်တယ်။** ဆိုင် row နဲ့ owner membership row နှစ်ခုကို **transaction တစ်ခုတည်း**မှာ ထည့်တယ်။ တစ်ခု မအောင်မြင်ရင် နှစ်ခုလုံး rollback ဖြစ်တယ်။ ဒါကြောင့် "owner မရှိတဲ့ ဆိုင်" ဆိုတာ ဘယ်တော့မှ မဖြစ်ဘူး။ Browser က insert နှစ်ခု သီးသန့် လုပ်ရင် ဒုတိယ insert မအောင်မြင်တဲ့အခါ ဆိုင် အလွတ် ကျန်ခဲ့နိုင်တယ်။
- **Table တွေမှာ insert/update/delete policy မထားဘူး။** Browser က `memberships` ထဲ ကိုယ်တိုင် row ထည့်ပြီး `role = 'owner'` လို့ ရေးလို့ မရဘူး။ RPC ကပဲ ထည့်ခွင့်ရှိတယ် (`security definer`)။
- **Helper function `current_org_id()` နဲ့ `is_owner()`:** နောက် phase တွေမှာ policy တိုင်းက `org_id = current_org_id()` လို့ ရေးမယ်။ ဒီ function တွေက `security definer` ဖြစ်လို့ `memberships` ရဲ့ RLS ကို မဖြတ်ဘဲ ဖတ်တယ်။ ဒါကြောင့် policy ထဲကနေ policy ပြန်ခေါ်တဲ့ **infinite recursion** မဖြစ်ဘူး။
- **Email ကို `memberships` ထဲ ကူးသိမ်းတယ်။** App က `auth.users` ကို မဖတ်နိုင်ဘူး (Phase 3 မှာ ပြောခဲ့သလို)။ နောက်ပိုင်း Members page မှာ "ဘယ်သူတွေ ရှိလဲ" ပြဖို့ email လိုတယ်။

## File တစ်ခုချင်းစီ

**`supabase/schema.sql` (ပြင်တယ်)**
`org_role` enum၊ `organizations` နဲ့ `memberships` table တွေ၊ helper function ၂ ခု၊ `create_organization` RPC နဲ့ RLS policy တွေ ထည့်ထားတယ်။

**`src/services/organizations.ts` (အသစ်)**
`getMyShop(userId)` က ကိုယ့်ဆိုင်နာမည်နဲ့ role ကို ယူတယ် (ဆိုင် မရှိရင် `null`)။ `createOrganization(name)` က RPC ကို ခေါ်တယ်။

**`src/shop/ShopContext.ts` (အသစ်)**
`useShop()` hook ဖြစ်တယ်။ ဘယ် page ကမဆို `shop` (ဆိုင်နာမည်၊ role) နဲ့ `reload()` ကို ယူလို့ရတယ်။

**`src/shop/ShopProvider.tsx` (အသစ်)**
Login ဝင်ထားတဲ့ user ရဲ့ ဆိုင်ကို load လုပ်တယ်။ Load မရရင် "Try again" ခလုတ် ပြတယ်။ User ပြောင်းရင် (`key={user.id}`) state အသစ်နဲ့ ပြန်စတယ်။

**`src/components/RequireShop.tsx` (အသစ်)**
ဆိုင် မရှိရင် `/onboarding` ကို ပို့တယ်။

**`src/pages/OnboardingPage.tsx` (အသစ်)**
"Create your shop" form ဖြစ်တယ်။ Account မှားဝင်မိရင် Log out လုပ်လို့ရအောင် link ပါတယ်။

**`src/components/CenteredCard.tsx` (အသစ်)**
Logo နဲ့ အလယ်က card ဖြစ်တယ်။ Login၊ Register၊ Onboarding သုံးခုလုံးမှာ ပြန်သုံးတယ်။

**`App.tsx`၊ `AuthLayout.tsx`၊ `AppLayout.tsx`၊ `Sidebar.tsx`၊ `types.ts` (ပြင်တယ်)**
Route အစီအစဉ်: `RequireAuth` → `ShopProvider` → (`/onboarding` သို့မဟုတ် `RequireShop` → `AppLayout`)။ Sidebar နဲ့ mobile top bar မှာ ဆိုင်နာမည် ပြတယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Multi-tenant ဆိုတာ
App တစ်ခု၊ database တစ်ခုတည်းကို ဆိုင်အများကြီး (tenant) မျှသုံးတယ်။ Row တိုင်းမှာ `org_id` ပါပြီး ကိုယ့်ဆိုင် row တွေကိုပဲ မြင်ရတယ်။ ဒီ phase က "ဘယ်သူ ဘယ်ဆိုင်လဲ" ကို မှတ်တာ ဖြစ်တယ်။ Product တွေကို ဆိုင်အလိုက် ခွဲတာက Phase 5 ဖြစ်တယ်။

### 2. RPC (Postgres function ကို browser ကနေ ခေါ်ခြင်း)
`supabase.rpc('create_organization', { org_name })` က database ထဲက function ကို ခေါ်တယ်။ Logic အများကြီးနဲ့ အဆင့်များတဲ့ အလုပ်ကို database ထဲမှာ လုံခြုံစွာ တစ်ခါတည်း လုပ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `supabase_flutter` မှာလည်း `supabase.rpc('create_organization', params: {...})` အတူတူပဲ။ Firebase မှာဆိုရင် Cloud Function ခေါ်တာနဲ့ ဆင်တူတယ်။

### 3. `security definer` နဲ့ `set search_path = ''`
`security definer` function က ခေါ်တဲ့သူရဲ့ ခွင့်ပြုချက်နဲ့ မဟုတ်ဘဲ function ပိုင်ရှင်ရဲ့ ခွင့်ပြုချက်နဲ့ run တယ်။ အစွမ်းထက်လို့ အန္တရာယ်လည်း ရှိတယ်။ ဒါကြောင့်:
- `auth.uid()` ကို စစ်တယ်။
- `search_path = ''` ထားပြီး `public.memberships` လို့ အပြည့်အစုံ ရေးတယ်။ (တခြားသူ ဖန်တီးထားတဲ့ table တုကို မှားခေါ်မိတာ ကာကွယ်ဖို့ ဖြစ်တယ်။)
- `anon` ကို execute ခွင့် ပိတ်ထားတယ်။

### 4. React `key` နဲ့ component ကို အသစ်ပြန်စခြင်း
`<ShopLoader key={userId} />`: `key` ပြောင်းရင် React က component အဟောင်းကို ဖျက်ပြီး အသစ် ဖန်တီးတယ်။ State အားလုံး အစကနေ ပြန်စတယ်။ ဒါကြောင့် user A logout ပြီး user B login ဝင်ရင် A ရဲ့ ဆိုင်နာမည် ခဏတောင် မပေါ်ဘူး။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `ValueKey(userId)` ပေးပြီး `State` object အသစ် ဖန်တီးခိုင်းတာနဲ့ အတူတူပဲ။

### 5. Nested route guard
Route တွေကို အထပ်ထပ် အုပ်ထားတယ်: login စစ် → ဆိုင် load → ဆိုင် ရှိ/မရှိ စစ်။ အဆင့်တိုင်းက အလုပ်တစ်ခုပဲ လုပ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** GoRouter ရဲ့ `redirect` မှာ `if (!loggedIn) return '/login'; if (shop == null) return '/onboarding';` လို့ ရေးတာနဲ့ တူတယ်။ ဒီမှာတော့ စစ်ချက်တစ်ခုကို component တစ်ခုစီ ခွဲထားတယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. ဆိုင် row နဲ့ owner membership row ကို browser ကနေ `insert` နှစ်ခါ သီးသန့် မလုပ်ဘဲ RPC function တစ်ခုထဲမှာ ဘာကြောင့် လုပ်တာလဲ။
2. User တစ်ယောက်က ဆိုင် နှစ်ဆိုင် ဖန်တီးဖို့ RPC ကို နှစ်ခါ ခေါ်ရင် ဘာဖြစ်မလဲ။ ဘယ်နေရာက တားတာလဲ။ (အဖြေ ၂ ခု ရှိတယ်။)
3. `current_org_id()` ကို `security definer` မလုပ်ဘဲ ရိုးရိုး function လုပ်ထားရင် `memberships` ရဲ့ policy (`org_id = current_org_id()`) မှာ ဘာပြဿနာ ဖြစ်နိုင်လဲ။
