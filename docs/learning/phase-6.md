# Phase 6 — Invite code နဲ့ Member များ

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**Workflow:**
1. Owner က **Settings** page မှာ **Generate invite code** ကို နှိပ်တယ်။ `K7QM-3XPA` လို code တစ်ခု ရတယ်။ **Copy** နှိပ်ပြီး staff ကို ပို့ပေးတယ်။
2. Staff က register/login ဝင်တယ်။ Onboarding မှာ **Join with invite code** ကို ရွေးပြီး code ထည့်တယ်။
3. Staff က owner ရဲ့ ဆိုင်ထဲ **staff** အဖြစ် ဝင်သွားတယ်။ ဆိုင်ရဲ့ product တွေကို မြင်ရတယ်။
4. Owner က Settings မှာ staff ကို **Remove** လုပ်နိုင်တယ်။ ဖယ်ခံရတဲ့ staff က page ကို ပြန်ဖွင့်တဲ့အခါ onboarding ကို ရောက်သွားတယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **Code ကို တစ်ခါပဲ သုံးလို့ရတယ်၊ ၇ ရက်ပဲ ခံတယ်။** Code ပေါက်ကြားသွားရင်တောင် အန္တရာယ် နည်းတယ်။
- **Code မှာ `0/O`၊ `1/I` မပါဘူး။** ဖုန်းနဲ့ ပြောပြရင်၊ စာနဲ့ ကူးရေးရင် မှားနိုင်လို့ ဖြစ်တယ်။ စာလုံး ၃၂ လုံးထဲက ၈ လုံး ဆိုတော့ ဖြစ်နိုင်ချေ ၁ ထရီလီယံ ကျော် (2⁴⁰) ရှိလို့ ခန့်မှန်းဖို့ မဖြစ်နိုင်ဘူး။
- **Code ကို `random()` နဲ့ မဟုတ်ဘဲ `gen_random_uuid()` ရဲ့ byte တွေနဲ့ ထုတ်တယ်။** `random()` က ခန့်မှန်းလို့ရနိုင်တယ်။ `gen_random_uuid()` ကတော့ လုံခြုံတဲ့ random ဖြစ်တယ်။
- **Code စစ်တာနဲ့ member ထည့်တာကို `join_organization()` function တစ်ခုတည်းမှာ လုပ်တယ်။** "Code မှန်လား → member ထည့် → code ကို used လို့ မှတ်" ဆိုတဲ့ အဆင့် ၃ ဆင့်ဟာ transaction တစ်ခုတည်း ဖြစ်တယ်။ Browser ကနေ သီးသန့် ခေါ်ရင် code ကို မှတ်ဖို့ မေ့သွားတာ၊ ကြားမှာ error တက်တာ ဖြစ်နိုင်တယ်။
- **`for update` နဲ့ invite row ကို lock လုပ်တယ်။** လူနှစ်ယောက်က code တစ်ခုတည်းကို တစ်ပြိုင်နက် ထည့်ရင် ဒုတိယလူက ပထမလူ ပြီးတဲ့အထိ စောင့်ရတယ်။ ပြီးရင် "used" ဖြစ်နေပြီမို့ ငြင်းခံရတယ်။
- **Code မှား၊ သုံးပြီး၊ သက်တမ်းကုန် သုံးမျိုးလုံးကို error message တစ်ခုတည်း ပြတယ်။** "ဒီ code ရှိတယ်၊ သုံးပြီးသွားပြီ" လို့ ပြောလိုက်ရင် code ခန့်မှန်းနေတဲ့သူကို သဲလွန်စ ပေးရာ ရောက်လို့ ဖြစ်တယ်။
- **Staff ဖယ်တာကို RPC မသုံးဘဲ RLS delete policy နဲ့ လုပ်တယ်။** Policy က "owner ဖြစ်ရမယ်၊ ဆိုင်တူရမယ်၊ ဖယ်မယ့်သူက `staff` ဖြစ်ရမယ်" ဆိုပြီး စစ်တယ်။ Owner ဟာ staff မဟုတ်လို့ ကိုယ့်ကိုယ်ကို ဖယ်လို့ မရဘူး။
- **`org_invites` ကို app က ဖတ်ပဲ ဖတ်လို့ရတယ်။** Insert/update ခွင့်ကို revoke လုပ်ထားတယ်။ Function နှစ်ခု (`security definer`) ကပဲ ရေးတယ်။

## File တစ်ခုချင်းစီ

**`supabase/schema.sql` (section 8 ထည့်တယ်)**
`org_invites` table၊ `create_invite()` နဲ့ `join_organization(code)` function နှစ်ခု၊ owner တွေ invite ဖတ်ခွင့်နဲ့ staff ဖယ်ခွင့် policy တွေ ပါတယ်။

**`src/services/members.ts` (အသစ်)**
`listMembers()`၊ `removeMember(userId)`၊ `createInvite()`၊ `listInvites()` ပါတယ်။ `removeMember` က RLS ပိတ်ထားလို့ ဘာမှ မဖျက်ရရင်တောင် error ပြတယ်။

**`src/services/organizations.ts` (ပြင်တယ်)**
`joinOrganization(code)` ကို ထည့်တယ်။ ဒါက `join_organization` RPC ကို ခေါ်တယ်။

**`src/pages/SettingsPage.tsx` (အသစ်)**
Member စာရင်း (email၊ role၊ ဝင်တဲ့ရက်) ပြတယ်။ Owner အတွက် "Generate invite code"၊ Copy၊ Remove နဲ့ မသုံးရသေးတဲ့ code စာရင်း ပါတယ်။

**`src/pages/OnboardingPage.tsx` (ပြင်တယ်)**
အပေါ်မှာ tab နှစ်ခု ရှိတယ်: "Create a shop" နဲ့ "Join with invite code"။

**`src/App.tsx`၊ `src/types.ts` (ပြင်တယ်)**
`/settings` route က `SettingsPage` ကို ပြတယ်။ `Member`၊ `OrgInvite` type တွေ ထည့်တယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Row lock (`select ... for update`)
Row တစ်ခုကို ဖတ်ပြီး transaction ပြီးတဲ့အထိ တခြား transaction တွေ ပြင်ခွင့် မပေးအောင် lock လုပ်တယ်။ "စစ်ပြီးမှ ပြင်" (check-then-act) လုပ်တဲ့အခါ race condition မဖြစ်အောင် သုံးတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `package:synchronized` ရဲ့ `Lock().synchronized(() async { ... })` နဲ့ ဆင်တူတယ်။ ဒီမှာတော့ database ကိုယ်တိုင်က row တစ်ခုချင်းစီကို lock လုပ်ပေးတယ်။

### 2. RLS က ပိတ်ထားတဲ့ delete က error မပြဘူး
Policy နဲ့ မကိုက်တဲ့ row ကို RLS က "မမြင်ရ" အောင် လုပ်ထားတယ်။ ဒါကြောင့် delete က row ၀ ခု ဖျက်ပြီး **အောင်မြင်တယ်** လို့ ပြန်ပြောတယ်။ ဒါကြောင့် `.select()` နဲ့ ဖျက်လိုက်တဲ့ row တွေကို ပြန်ယူပြီး ၀ ခု ဖြစ်နေရင် ကိုယ်တိုင် error ပြရတယ်။

### 3. Generic state နဲ့ union type (`'create' | 'join'`)
`useState<Mode>('create')` မှာ `Mode` က string နှစ်ခုထဲက တစ်ခုပဲ ဖြစ်နိုင်တယ်။ `TEXT: Record<Mode, ...>` က mode တိုင်းအတွက် စာသား ရှိရမယ်လို့ TypeScript က စစ်ပေးတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `enum Mode { create, join }` နဲ့ `Map<Mode, ...>` လိုပဲ။ ဒါပေမယ့် TypeScript မှာ enum မလိုဘဲ string literal တွေကို တိုက်ရိုက် type အဖြစ် သုံးလို့ရတယ်။

### 4. `navigator.clipboard.writeText()`
Browser ထဲမှာ ပါပြီးသား API ဖြစ်လို့ library မလိုဘူး။ Promise ပြန်ပေးတယ် (ခွင့်မရရင် error တက်တယ်)။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `Clipboard.setData(ClipboardData(text: code))` နဲ့ အတူတူပဲ။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. `join_organization` ထဲမှာ `for update` မပါရင် လူနှစ်ယောက်က code တစ်ခုတည်းကို တစ်ပြိုင်နက် ထည့်တဲ့အခါ ဘာဖြစ်နိုင်လဲ။
2. Owner က တခြားဆိုင်က staff ရဲ့ `user_id` နဲ့ `removeMember()` ကို ခေါ်ရင် ဘာဖြစ်မလဲ။ ဘယ်အချက်က တားတာလဲ။ App မှာ ဘယ် message ပေါ်မလဲ။
3. Code မှား၊ သုံးပြီးသား၊ သက်တမ်းကုန်တာကို error message တစ်ခုတည်း ဘာကြောင့် ပြတာလဲ။
