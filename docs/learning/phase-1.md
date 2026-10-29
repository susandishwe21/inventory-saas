# Phase 1 — Tailwind CSS

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

- **Tailwind CSS v4** ကို ထည့်ပြီး products page၊ product form၊ stock panel တို့ကို production app တစ်ခုလို ပြန် design လုပ်ခဲ့တယ်။
- အရင် code မှာ `style={{ padding: 24 }}` လို inline style တွေ သုံးထားတယ်။ အဲ့ဒါတွေ အားလုံးကို `className="px-4 py-8"` လို Tailwind class တွေနဲ့ အစားထိုးခဲ့တယ်။
- Vite template နဲ့ ပါလာတဲ့ CSS (`App.css` ၁၈၄ ကြောင်း၊ `index.css` ၁၁၁ ကြောင်း) ကို ဖယ်ရှားခဲ့တယ်။ ဒီ CSS တွေက `#root` ကို အလယ်ပို့တာ၊ စာလုံးကြီးတွေ ထားတာမျိုး လုပ်နေလို့ ကိုယ့် design ကို နှောင့်ယှက်နေတာ ဖြစ်တယ်။
- **Logic တစ်ခုမှ မပြောင်းခဲ့ဘူး။** State၊ handler၊ service call တွေ အကုန် အရင်အတိုင်းပဲ။ Phase တစ်ခုမှာ အလုပ်တစ်ခုပဲ လုပ်ရင် ပြဿနာ ပေါ်လာတဲ့အခါ ဘယ်နေရာက ဖြစ်တာလဲ ရှာရ လွယ်တယ်။

**Design ပိုင်း ရွေးချယ်ခဲ့တာတွေ**

- **Card style:** အဖြူရောင် card၊ ထောင့်ဝိုင်း၊ အရိပ်နည်းနည်း ထည့်ထားတယ်။ Background ကို မီးခိုးနုရောင် (`slate-50`) ထားလို့ card တွေ ကွဲကွဲပြားပြား မြင်ရတယ်။
- **Indigo color:** Primary button (အဓိက လုပ်ဆောင်ချက်) တစ်ခုတည်းကိုပဲ အရောင်ထည့်ထားတယ်။ ကျန်တာတွေက မီးခိုးရောင် ဖြစ်တယ်။ ဒါမှ user က ဘာနှိပ်ရမလဲ ချက်ချင်း သိတယ်။
- **Number တွေ ညာဘက်ညှိ:** စျေးနှုန်းနဲ့ stock ကို ညာဘက် ညှိထားပြီး `tabular-nums` သုံးထားတယ်။ ဂဏန်းတိုင်း အကျယ်တူလို့ column ထဲမှာ ညီညီညာညာ ဖြစ်တယ်။
- **Label အပြည့်အစုံ:** Input တိုင်းမှာ label ပါတယ်။ Placeholder တစ်ခုတည်းဆိုရင် စာရိုက်လိုက်တာနဲ့ ပျောက်သွားလို့ ဘာ field လဲ မသိတော့ဘူး။
- **Empty state:** Product မရှိသေးရင် table အလွတ် မပြဘဲ "No products yet…" ဆိုတဲ့ စာ ပြတယ်။

## File တစ်ခုချင်းစီ

**`frontend/vite.config.ts`**
Vite မှာ `tailwindcss()` plugin ကို ထည့်ထားတယ်။ ဒီ plugin က code ထဲမှာ သုံးထားတဲ့ class တွေကို ရှာပြီး လိုအပ်တဲ့ CSS ကိုပဲ ထုတ်ပေးတယ်။

**`frontend/src/index.css`**
`@import "tailwindcss";` နဲ့ Tailwind ကို ခေါ်ထားတယ်။ ထပ်ခါထပ်ခါ သုံးတဲ့ `.btn`၊ `.input`၊ `.card`၊ `.label`၊ `.alert-error` class တွေကို ဒီမှာ တစ်ခါတည်း သတ်မှတ်ထားတယ်။

**`frontend/src/App.tsx`**
Products page ဖြစ်တယ်။ Header (ခေါင်းစဉ်၊ product အရေအတွက်၊ Add button)၊ product table နဲ့ empty state ပါတယ်။ "Sold out" ကို အနီရောင် pill (ပုံသဏ္ဌာန်ဝိုင်းလေး) အနေနဲ့ ပြတယ်။

**`frontend/src/components/ProductForm.tsx`**
Product အသစ်ထည့်တဲ့ form ကို card ထဲမှာ ပြတယ်။ Screen ကျယ်ရင် ၂ column၊ ကျဉ်းရင် ၁ column ဖြစ်တယ်။

**`frontend/src/components/StockPanel.tsx`**
ဘယ်ဘက်မှာ stock ထည့်/ထုတ်တဲ့ form၊ ညာဘက်မှာ မကြာသေးခင်က movement စာရင်း ပြတယ်။ `+` ဆိုရင် အစိမ်း၊ `−` ဆိုရင် အနီ ပြတယ်။

**ဖျက်လိုက်တာ:** `frontend/src/App.css` (ဘယ်နေရာကမှ import မလုပ်ထားလို့)။
**ပြောင်းလိုက်တာ:** `index.html` ထဲက browser tab ခေါင်းစဉ်ကို `frontend` ကနေ `Inventory` ပြောင်းထားတယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Utility class (Tailwind)
`className="px-4 py-3 text-sm"` ဆိုတာ class သေးသေးလေးတွေကို ပေါင်းသုံးတာ ဖြစ်တယ်။ Class တစ်ခုက အလုပ်တစ်ခုပဲ လုပ်တယ်။

**Flutter နဲ့ နှိုင်းယှဉ်ရင်:**
```dart
Padding(
  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  child: Text('Hi', style: TextStyle(fontSize: 14)),
)
```
```tsx
<p className="px-4 py-3 text-sm">Hi</p>
```
Flutter မှာ widget property နဲ့ style သတ်မှတ်သလိုပဲ၊ ဒီမှာ class နာမည်နဲ့ သတ်မှတ်တာ ဖြစ်တယ်။ `px-4` = 16px (Tailwind မှာ ၁ ယူနစ် = 4px)။

### 2. `@layer components` နဲ့ `@apply`
Button တိုင်းမှာ class ၁၀ ခုလောက် ထပ်ရေးရရင် ပင်ပန်းတယ်။ ဒါကြောင့် `index.css` ထဲမှာ `.btn` ဆိုတဲ့ class တစ်ခု ဖန်တီးပြီး `@apply` နဲ့ Tailwind class တွေကို စုထည့်ထားတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `ThemeData` ထဲမှာ `elevatedButtonTheme` တစ်ခါ သတ်မှတ်ပြီး button တိုင်းက အဲ့ဒီ style ကို သုံးသွားတာနဲ့ တူတယ်။

### 3. State variant (`hover:`, `focus-visible:`, `disabled:`)
`hover:bg-slate-50` ဆိုရင် mouse တင်ထားမှပဲ background ပြောင်းတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.hovered) ? ... : ...)` နဲ့ တူပေမယ့် ပိုတိုတယ်။

### 4. Responsive prefix (`sm:`, `md:`)
`grid sm:grid-cols-2` ဆိုရင် ဖုန်းမှာ ၁ column၊ screen 640px ထက် ကျယ်ရင် ၂ column ဖြစ်တယ်။ Prefix မပါတဲ့ class က အသေးဆုံး screen အတွက်ဖြစ်ပြီး prefix ပါတာက အဲ့ဒီ size နဲ့ အထက်အတွက် ဖြစ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `LayoutBuilder` ထဲမှာ `constraints.maxWidth > 640 ? Row(...) : Column(...)` ရေးတာနဲ့ တူတယ်။

### 5. `<label>` နဲ့ input ကို ချိတ်ခြင်း
`<label><span>Name</span><input /></label>` လို input ကို label ထဲ ထည့်ရင် label စာကို နှိပ်လည်း input ကို focus ဖြစ်တယ်။ Screen reader တွေကလည်း field နာမည်ကို ဖတ်ပေးနိုင်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `TextField(decoration: InputDecoration(labelText: 'Name'))` နဲ့ တူတယ်။

### 6. Dev dependency (`npm install -D`)
`-D` နဲ့ install လုပ်ရင် `devDependencies` ထဲ ရောက်တယ်။ Build လုပ်ချိန်မှာပဲ လိုတဲ့ tool ဖြစ်တယ်။ Tailwind က build လုပ်ချိန်မှာ CSS file ထုတ်ပေးပြီးရင် browser ထဲမှာ Tailwind code မပါတော့ဘူး။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `pubspec.yaml` ထဲက `dev_dependencies` (ဥပမာ `build_runner`) နဲ့ တူတယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. `className="p-6 md:p-10"` ဆိုရင် ဖုန်းမှာ padding ဘယ်လောက်လဲ။ Laptop မှာရော ဘယ်လောက်လဲ။
2. Button တိုင်းမှာ class အရှည်ကြီး မရေးဘဲ `.btn` ကို `index.css` ထဲမှာ ဘာကြောင့် တစ်ခါတည်း သတ်မှတ်ခဲ့တာလဲ။ ဒီ style ကို Flutter မှာဆိုရင် ဘယ်နေရာမှာ သတ်မှတ်မလဲ။
3. ဒီ phase မှာ edit form က product data ကို ကြိုမဖြည့်တဲ့ bug ကို ဘာကြောင့် မပြင်ခဲ့တာလဲ။
