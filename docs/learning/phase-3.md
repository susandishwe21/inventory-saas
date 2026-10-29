# Phase 3 — Login နဲ့ Register (Supabase Auth)

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**Workflow:**
1. Login မဝင်ရသေးဘဲ `/products` ကို ဖွင့်ရင် `/login` ကို ရောက်သွားတယ်။
2. `/register` မှာ email နဲ့ password ထည့်ပြီး account ဖွင့်တယ်။ (Supabase မှာ "Confirm email" ဖွင့်ထားရင် "Check your email" ပေါ်တယ်။)
3. Login ဝင်ပြီးရင် အစက ဖွင့်ချင်ခဲ့တဲ့ page (ဥပမာ `/products?page=2`) ကို ပြန်ပို့ပေးတယ်။
4. Sidebar အောက်ခြေမှာ email နဲ့ **Log out** ခလုတ် ပေါ်တယ်။ Log out နှိပ်ရင် `/login` ကို ပြန်ရောက်တယ်။
5. Browser ကို refresh လုပ်လည်း login ဆက်ဝင်ထားတယ်။ (supabase-js က session ကို `localStorage` မှာ သိမ်းထားလို့ ဖြစ်တယ်။)

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **အကာအကွယ် နှစ်ထပ် ရှိတယ်။**
  - **UI** (`RequireAuth`) က login မဝင်ထားတဲ့သူကို page မပြဘဲ `/login` ကို ပို့တယ်။ ဒါက အသုံးပြုသူ အဆင်ပြေဖို့ပဲ ဖြစ်တယ်။
  - **Database** (RLS policy `to authenticated`) က တကယ့် လုံခြုံရေး ဖြစ်တယ်။ Anon key က browser code ထဲမှာ ရှိနေလို့ ဘယ်သူမဆို ယူသုံးနိုင်တယ်။ UI ကို ကျော်ပြီး API ကို တိုက်ရိုက် ခေါ်ရင်တောင် login မဝင်ထားရင် database က data မပေးဘူး။
- **Session ကို တစ်နေရာတည်း (`AuthProvider`) မှာ သိမ်းတယ်။** Page တိုင်းက `useAuth()` နဲ့ ယူသုံးတယ်။ Login/logout ဖြစ်တိုင်း `onAuthStateChange` က သတင်းပို့လို့ app တစ်ခုလုံး အလိုအလျောက် update ဖြစ်တယ်။
- **Login page က ကိုယ်တိုင် navigate မလုပ်ဘူး။** Login အောင်မြင်ရင် session ပြောင်းသွားတယ်။ `AuthLayout` က အဲဒါကို မြင်ပြီး redirect လုပ်ပေးတယ်။ ဒါကြောင့် "ဘယ်ကို ပို့မလဲ" ဆိုတဲ့ logic က တစ်နေရာတည်းမှာပဲ ရှိတယ်။
- **Stock movements က audit log ဖြစ်လို့** read နဲ့ insert policy ပဲ ပေးထားတယ်။ Update နဲ့ delete policy မရှိလို့ ပြင်လို့လည်း မရ၊ ဖျက်လို့လည်း မရဘူး။
- **ပုံကြည့်တာက public ဆက်ဖြစ်တယ်။** Upload၊ ပြောင်း၊ ဖျက်တာကိုပဲ login လိုတယ်။

## File တစ်ခုချင်းစီ

**`src/services/auth.ts` (အသစ်)**
`supabase.auth` ကို ခေါ်တာ ဒီ file ထဲမှာပဲ ရှိတယ် (CLAUDE.md စည်းကမ်း)။ `signIn`၊ `signUp`၊ `signOut`၊ `getSession`၊ `onAuthChange` ပါတယ်။ Supabase ရဲ့ error code (`invalid_credentials` စတာ) တွေကို နားလည်လွယ်တဲ့ စာ ပြောင်းပေးတယ်။

**`src/auth/AuthContext.ts` (အသစ်)**
`AuthContext` နဲ့ `useAuth()` hook ပါတယ်။ ဘယ် component ကမဆို `session` နဲ့ `loading` ကို ယူလို့ရတယ်။ Provider component နဲ့ file ခွဲထားရတာက lint rule (`only-export-components`) ကြောင့် ဖြစ်တယ်။

**`src/auth/AuthProvider.tsx` (အသစ်)**
App စဖွင့်တဲ့အခါ သိမ်းထားတဲ့ session ကို တစ်ခါ ဖတ်တယ်။ ပြီးရင် login/logout/token refresh တိုင်းကို နားထောင်တယ်။ Component unmount ဖြစ်ရင် နားထောင်တာ ရပ်တယ်။

**`src/components/RequireAuth.tsx` (အသစ်)**
Login လိုတဲ့ route တွေကို အုပ်ထားတယ်။ Session မရှိရင် `/login` ကို ပို့ပြီး အစက ဖွင့်ချင်ခဲ့တဲ့ page ကို `state.from` မှာ မှတ်ထားတယ်။

**`src/layouts/AuthLayout.tsx` (အသစ်)**
Login/Register အတွက် အလယ်က card layout ဖြစ်တယ်။ Login ဝင်ပြီးသားဆိုရင် `from` page (မရှိရင် `/dashboard`) ကို ပို့တယ်။

**`src/pages/LoginPage.tsx`၊ `RegisterPage.tsx` (အသစ်)**
Email/password form တွေ ဖြစ်တယ်။ Register မှာ password နှစ်ခါ ရိုက်တာ တူမတူ စစ်တယ်။ ၆ လုံး အနည်းဆုံး ဖြစ်ရမယ်။

**`App.tsx`၊ `Sidebar.tsx`၊ `icons.tsx` (ပြင်တယ်)**
Route တွေကို public (`AuthLayout`) နဲ့ protected (`RequireAuth` → `AppLayout`) ဆိုပြီး နှစ်ပိုင်း ခွဲထားတယ်။ Sidebar မှာ email နဲ့ Log out ထည့်ထားတယ်။

**`supabase/schema.sql` (ပြင်တယ်)**
`dev: anyone can …` policy တွေကို `signed in: …` (`to authenticated`) နဲ့ အစားထိုးတယ်။ `stock_movements` ကို RLS ဖွင့်ပေးတယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. React Context (`createContext` / `useContext`)
Data ကို component tree တစ်ခုလုံးကို props နဲ့ တဆင့်ချင်း မပို့ဘဲ ပေးလို့ရတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `Provider` package ရဲ့ `ChangeNotifierProvider` + `context.watch<AuthState>()` ဒါမှမဟုတ် `InheritedWidget` နဲ့ အတူတူပဲ။ `useAuth()` က `context.watch()` နဲ့ ဆင်တူတယ်။

### 2. Auth state ကို နားထောင်ခြင်း (`onAuthStateChange`)
Login/logout ဖြစ်တိုင်း callback ကို ခေါ်တယ်။ `useEffect` ရဲ့ cleanup မှာ `unsubscribe()` လုပ်ရတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `supabase.auth.onAuthStateChange.listen(...)` (Stream) ကို `StreamSubscription` နဲ့ နားထောင်ပြီး `dispose()` မှာ `cancel()` လုပ်တာနဲ့ အတူတူပဲ။

### 3. Protected route (`RequireAuth` + `<Navigate>`)
Route တွေကို component တစ်ခုနဲ့ အုပ်ပြီး login မဝင်ရင် တခြားနေရာ ပို့တယ်။ `state` နဲ့ "ဘယ်ကနေ လာခဲ့လဲ" ကို မှတ်ထားလို့ရတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** GoRouter ရဲ့ `redirect: (context, state) => loggedIn ? null : '/login'` နဲ့ အတူတူပဲ။

### 4. RLS role: `anon` နဲ့ `authenticated`
Supabase က request တိုင်းကို role တစ်ခုနဲ့ run တယ်။ Login မဝင်ရင် `anon`၊ login ဝင်ရင် `authenticated` (JWT token ထဲမှာ ပါတယ်)။ Policy မှာ `to authenticated` လို့ ရေးရင် login ဝင်ထားသူအတွက်ပဲ အလုပ်လုပ်တယ်။ Anon အတွက် policy မရှိလို့ RLS က row တစ်ခုမှ မပြဘူး (error မတက်ဘဲ `[]` ပြန်ပေးတယ်)။

### 5. "Loading" state ရဲ့ အရေးကြီးမှု
App စဖွင့်ချိန်မှာ session ရှိ/မရှိ ကို ချက်ချင်း မသိသေးဘူး။ `loading` မထားရင် login ဝင်ထားတဲ့သူကိုတောင် `/login` ကို ခဏ ပို့မိမယ်။ ဒါကြောင့် `loading` ဖြစ်နေတုန်း "Loading…" ပဲ ပြတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `FutureBuilder` မှာ `ConnectionState.waiting` ကို စစ်ပြီး spinner ပြတာနဲ့ တူတယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. `RequireAuth` က login မဝင်တဲ့သူကို page မပြဘူး။ ဒါဆိုရင် database မှာ `to authenticated` policy ကို ဘာကြောင့် ထပ်လိုသေးတာလဲ။
2. `AuthProvider` မှာ `loading` state မထားရင် page ကို refresh လုပ်တဲ့အခါ ဘာဖြစ်နိုင်လဲ။
3. Login page က login အောင်မြင်ပြီးရင် `navigate()` ကို ကိုယ်တိုင် မခေါ်ဘူး။ ဒါဆို user ကို `/dashboard` (ဒါမှမဟုတ် အစက page) ကို ဘယ်သူ ပို့ပေးတာလဲ။
