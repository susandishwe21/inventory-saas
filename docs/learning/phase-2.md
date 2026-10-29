# Phase 2 — Router နဲ့ Sidebar layout

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

- **React Router** ကို ထည့်ပြီး app ကို page အများကြီးပါတဲ့ app ဖြစ်အောင် လုပ်ခဲ့တယ်။ Page တိုင်းမှာ ကိုယ်ပိုင် URL ရှိတယ် (`/products`၊ `/history` …)။ ဒါကြောင့် refresh လုပ်လည်း page မပျောက်ဘူး၊ browser ရဲ့ Back button လည်း အလုပ်လုပ်တယ်။
- **Sidebar ကို workflow အလိုက် အုပ်စုခွဲထားတယ်။** Overview (အခြေအနေ ကြည့်တာ) → Inventory (ကုန်ပစ္စည်း စီမံတာ) → Stock (ဝင်/ထွက် မှတ်တမ်း)။ Settings ကိုတော့ အောက်ဆုံးမှာ ထားတယ်။ User က ဘယ်အလုပ်အတွက် ဘယ်နေရာ သွားရမလဲ ချက်ချင်း သိနိုင်တယ်။
- **မဆောက်ရသေးတဲ့ page တွေ** က "Coming in Phase X" ပြတယ်။ Sidebar ကို အခုကတည်းက အပြည့်အစုံ မြင်ရပြီး ဘယ် phase မှာ ပြီးမလဲလည်း သိရတယ်။
- **Phone screen မှာ** sidebar ကို ဖျောက်ထားပြီး ☰ ခလုတ်နှိပ်မှ ဘေးကနေ ထွက်လာတယ်။
- **Products page ကို `App.tsx` ကနေ `pages/ProductsPage.tsx` ကို ရွှေ့ခဲ့တယ်။** `App.tsx` မှာ route စာရင်းပဲ ကျန်တော့တယ်။
- **Lint warning ကို ပြင်ခဲ့တယ်။** `useEffect` ထဲမှာ `setState` ကို ချက်ချင်း (synchronously) ခေါ်နေတာ ဖြစ်တယ်။ အခု data ရောက်လာမှ `.then()` ထဲမှာပဲ state ကို update လုပ်တယ်။

## File တစ်ခုချင်းစီ

**`src/App.tsx`**
Route စာရင်း ဖြစ်တယ်။ URL တစ်ခုချင်းစီအတွက် ဘယ် page ပြမလဲ သတ်မှတ်ထားတယ်။ Page အားလုံးက `AppLayout` ထဲမှာ ပေါ်တယ်။ `/` ကို `/dashboard` ဆီ ပို့ပြီး မရှိတဲ့ URL ဆိုရင် 404 page ပြတယ်။

**`src/layouts/AppLayout.tsx`**
App ရဲ့ အခွံ (shell) ဖြစ်တယ်။ ဘယ်ဘက်မှာ sidebar၊ ညာဘက်မှာ `<Outlet />` ပါတယ်။ `<Outlet />` နေရာမှာ လက်ရှိ URL ရဲ့ page ပေါ်လာတယ်။ Phone အတွက် menu ဖွင့်/ပိတ် state လည်း ဒီမှာ ရှိတယ်။

**`src/components/Sidebar.tsx`**
Menu အုပ်စုတွေကို `GROUPS` array ထဲမှာ data အနေနဲ့ ထားပြီး loop ပတ်ပြီး ဆွဲတယ်။ Menu အသစ်ထည့်ချင်ရင် array ထဲမှာ တစ်ကြောင်း ထည့်ရုံပဲ။ `NavLink` က လက်ရှိ page ရဲ့ link ကို အရောင်ပြောင်းပြတယ်။

**`src/components/icons.tsx`**
Icon library မသုံးဘဲ SVG path တွေနဲ့ ကိုယ်တိုင် ဆွဲထားတဲ့ icon တွေ ဖြစ်တယ်။ `<Icon name="products" />` လို နာမည်နဲ့ ခေါ်သုံးတယ်။ နာမည်မှားရင် TypeScript က error ပြတယ်။

**`src/pages/ProductsPage.tsx`**
အရင် `App.tsx` ထဲက products page ကို ဒီကို ရွှေ့ထားတာ ဖြစ်တယ်။ ပုံစံ၊ logic အတူတူပဲ။ မတူတာက first load ကို `.then()` နဲ့ ရေးထားတာ တစ်ခုပဲ။

**`src/pages/PlaceholderPage.tsx`**
Title၊ description နဲ့ phase နံပါတ်ကို props အနေနဲ့ ယူပြီး "Coming in Phase X" ပြတဲ့ page ဖြစ်တယ်။ မဆောက်ရသေးတဲ့ page ၅ ခုက ဒီ component တစ်ခုတည်းကို ပြန်သုံးတယ်။

**`src/pages/NotFoundPage.tsx`**
မရှိတဲ့ URL ကို သွားရင် ပြတဲ့ 404 page ဖြစ်တယ်။ Dashboard ကို ပြန်သွားတဲ့ ခလုတ် ပါတယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Router နဲ့ route list
URL တစ်ခုကို page component တစ်ခုနဲ့ ချိတ်ပေးတာ ဖြစ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `go_router` ရဲ့ `GoRouter(routes: [GoRoute(path: '/products', builder: ...)])` နဲ့ အတူတူပဲ။ `createBrowserRouter([...])` က `GoRouter(...)` ဖြစ်ပြီး `<RouterProvider router={router} />` က `MaterialApp.router(routerConfig: router)` ဖြစ်တယ်။

### 2. Layout route နဲ့ `<Outlet />`
`path` မပါဘဲ `element: <AppLayout />` နဲ့ `children` ပါတဲ့ route ကို layout route လို့ ခေါ်တယ်။ Child page တွေက `<Outlet />` နေရာမှာ ပေါ်တယ်။ Sidebar ကတော့ မပြောင်းဘဲ ဒီအတိုင်း ကျန်နေတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `go_router` ရဲ့ `ShellRoute(builder: (context, state, child) => Scaffold(drawer: ..., body: child))` နဲ့ တူတယ်။ `<Outlet />` = `child`။

### 3. `NavLink` နဲ့ `isActive`
`NavLink` က `Link` လိုပဲ page ပြောင်းပေးတယ်။ ထူးခြားချက်က လက်ရှိ URL နဲ့ ကိုက်ရင် `isActive = true` ဖြစ်တာပဲ။ ဒါကြောင့် active link ကို အရောင်ပြောင်းလို့ ရတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `NavigationRail` ရဲ့ `selectedIndex` ကို ကိုယ်တိုင် တွက်ရတဲ့အစား router က အလိုအလျောက် တွက်ပေးတာ ဖြစ်တယ်။

### 4. `<Navigate replace />` (redirect)
`/` ကို ဖွင့်ရင် `/dashboard` ဆီ ချက်ချင်း ပို့တယ်။ `replace` ပါရင် browser history ထဲမှာ `/` ကို `/dashboard` နဲ့ အစားထိုးတယ်။ ဒါကြောင့် Back နှိပ်ရင် `/` ကို ပြန်ရောက်ပြီး ထပ် redirect ဖြစ်တဲ့ loop မဖြစ်ဘူး။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `context.go()` နဲ့ `Navigator.pushReplacement` ဆင်တူတယ်။ `go_router` မှာ `redirect:` နဲ့ တူတယ်။

### 5. Data-driven UI (menu ကို array နဲ့ ဆွဲခြင်း)
Menu item တွေကို JSX ထဲမှာ တစ်ခုချင်း မရေးဘဲ `GROUPS` array ထဲမှာ data အနေနဲ့ ထားပြီး `.map()` နဲ့ ဆွဲတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `items.map((i) => ListTile(...)).toList()` နဲ့ အတူတူပဲ။

### 6. `useEffect` ထဲမှာ `setState` ချက်ချင်း မခေါ်ရခြင်း
`useEffect` က render ပြီးမှ run တယ်။ အဲ့ဒီထဲမှာ `setState` ချက်ချင်း ခေါ်ရင် render ထပ်ဖြစ်တယ်။ Data ရောက်လာမှ (`.then()` ထဲမှာ) `setState` ခေါ်တာက မှန်ကန်တဲ့ နည်းပါ။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `build()` method ထဲမှာ `setState()` မခေါ်ရတာနဲ့ ဆင်တူတယ်။ `initState()` ထဲမှာ `fetch().then((data) => setState(...))` ရေးတာနဲ့ တူတယ်။

### 7. Deploy လုပ်ရင် SPA fallback လိုတယ်
`/products` ဆိုတာ server ပေါ်မှာ file အစစ် မဟုတ်ဘူး၊ browser ထဲက React Router ပဲ သိတဲ့ path ဖြစ်တယ်။ Dev server (Vite) က URL ဘယ်ဟာပဲ ဖြစ်ဖြစ် `index.html` ကို ပြန်ပေးလို့ refresh လုပ်လည်း အလုပ်လုပ်တယ်။ Vercel၊ Netlify စတဲ့ နေရာမှာ deploy လုပ်ရင်တော့ "URL အားလုံးကို `index.html` ဆီ rewrite လုပ်ပါ" ဆိုတဲ့ setting ထည့်ရမယ်။ မထည့်ရင် refresh လုပ်တဲ့အခါ 404 ဖြစ်မယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. Products page ကနေ Categories ကို သွားတဲ့အခါ `AppLayout` နဲ့ `Sidebar` က ပြန်ဆွဲ (re-mount) ဖြစ်သလား။ ဘယ်အပိုင်းပဲ ပြောင်းသလဲ။ ဘာကြောင့်လဲ။
2. Sidebar မှာ "Reports" ဆိုတဲ့ menu အသစ်တစ်ခု ထည့်ချင်ရင် ဘယ် file ၂ ခုကို ပြင်ရမလဲ။
3. `<Navigate to="/dashboard" replace />` ထဲက `replace` ကို ဖြုတ်လိုက်ရင် Back button နှိပ်တဲ့အခါ ဘာဖြစ်မလဲ။
