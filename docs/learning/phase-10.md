# Phase 10 — Categories (ကုန်ပစ္စည်း အမျိုးအစား)

> Roadmap မှာ Phase 10 ဖြစ်ပေမယ့် login နဲ့ organization (Phase 3–7) မတိုင်ခင် စောစော လုပ်ခဲ့တယ်။ ဒါကြောင့် `org_id` မပါသေးဘူး။ Owner ပဲ ပြင်လို့ရတဲ့ စည်းကမ်းလည်း မပါသေးဘူး။ Phase 5 နဲ့ Phase 7 မှာ ထပ်ဖြည့်ရမယ်။

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**Workflow:**
1. **Categories page** မှာ Beverages၊ Snacks စတဲ့ category တွေ ဖန်တီးတယ်။ Category တစ်ခုချင်းစီမှာ product ဘယ်နှခု ရှိလဲ ပြတယ်။ နာမည်ပြောင်းလို့ (Rename)၊ ဖျက်လို့ (Delete) ရတယ်။
2. **Product form** မှာ category ကို ရွေးတယ်။
3. **Products table** မှာ Category column ပေါ်တယ်။
4. Category ကို ဖျက်ရင် အထဲက product တွေ **မပျက်ဘူး**။ "—" (category မရှိ) ဖြစ်သွားတာပဲ။ ဖျက်ခင် product ဘယ်နှခု ထိခိုက်မလဲ confirm box မှာ ပြောပြတယ်။

**ဘာကြောင့် ဒီလို လုပ်ခဲ့လဲ:**
- **Product တစ်ခုမှာ category တစ်ခုပဲ ရှိတယ်** (`products.category_id`)။ Roadmap ရဲ့ Decisions table မှာ သဘောတူထားတာ ဖြစ်တယ်။ Join table မလိုလို့ ရိုးရှင်းတယ်။
- **`on delete set null`:** Category ကို ဖျက်ရင် database ကိုယ်တိုင်က product တွေရဲ့ `category_id` ကို `null` ပြောင်းပေးတယ်။ Code ထဲမှာ product တွေကို လိုက်ပြင်စရာ မလိုဘူး။
- **`lower(name)` နဲ့ unique:** "Snacks" နဲ့ "snacks" ကို တူတူပဲလို့ သတ်မှတ်ပြီး ထပ်ထည့်ခွင့် မပေးဘူး။
- **Add နဲ့ Rename ကို table ထဲမှာပဲ (inline) လုပ်တယ်။** Category မှာ နာမည် တစ်ခုပဲ ရှိလို့ popup သီးသန့် မလိုဘူး။
- **Edit form bug ကို ဒီ phase မှာ ပြင်ခဲ့တယ်။** အရင်က Edit နှိပ်ရင် form အလွတ် ပေါ်တယ်။ ဒီအတိုင်းဆိုရင် category ရွေးဖို့ အကုန် ပြန်ရိုက်ရမယ်။ အခု product ရဲ့ လက်ရှိ data နဲ့ ဖြည့်ပြီးသား ပေါ်တယ်။
- **Edit လုပ်ရင် stock field ကို ဖျောက်ထားတယ်။** "Stock ကို stock movement နဲ့ပဲ ပြောင်းရမယ်" ဆိုတဲ့ စည်းကမ်းကြောင့် ဖြစ်တယ်။ Edit ကနေ stock ကို ပြင်ခွင့် ပေးရင် ဘယ်သူ၊ ဘာကြောင့် ပြောင်းလဲ ဆိုတဲ့ မှတ်တမ်း (history) မကျန်ဘူး။

## File တစ်ခုချင်းစီ

**`src/services/categories.ts` (အသစ်)**
Category စာရင်း ယူတာ၊ ထည့်တာ၊ နာမည်ပြောင်းတာ၊ ဖျက်တာ function ၄ ခု ပါတယ်။ `products(count)` နဲ့ category တစ်ခုစီရဲ့ product အရေအတွက်ကို request တစ်ခုတည်းမှာ တွက်ယူတယ်။

**`src/services/errors.ts` (အသစ်)**
`friendlyError` ကို `products.ts` ထဲကနေ ဒီကို ရွှေ့ထားတယ်။ Service ၂ ခုလုံး ပြန်သုံးလို့ ရအောင် ဖြစ်တယ်။ နာမည်ထပ်နေရင် (error code `23505`) service တစ်ခုချင်းစီက ကိုယ်ပိုင် message ပေးလို့ ရတယ် ("This SKU already exists." / "A category with this name already exists.")။

**`src/pages/CategoriesPage.tsx` (အသစ်)**
Categories page ဖြစ်တယ်။ ထဲမှာ `CategoryNameForm` ဆိုတဲ့ component သေးလေး တစ်ခု ပါတယ်။ Add အတွက်ရော Rename အတွက်ပါ အဲ့ဒီ form တစ်ခုတည်းကို ပြန်သုံးတယ်။ Escape ခလုတ် နှိပ်ရင် cancel ဖြစ်တယ်။

**`src/components/ProductForm.tsx` (ပြင်တယ်)**
Category dropdown ထည့်ထားတယ်။ Edit လုပ်ရင် လက်ရှိ data နဲ့ ဖြည့်ပြီးသား ပေါ်တယ်။ Edit လုပ်ရင် stock field မပါဘူး။ Category မရှိသေးရင် "Create one" link ပြတယ်။

**`src/services/products.ts`၊ `src/types.ts`၊ `src/pages/ProductsPage.tsx`၊ `src/App.tsx` (ပြင်တယ်)**
Product တွေကို ယူတဲ့အခါ category နာမည်ကိုပါ တစ်ခါတည်း ယူတယ်။ Type အသစ်တွေ ထည့်ထားတယ်။ Table မှာ Category column ထည့်ထားတယ်။ `/categories` ကို placeholder အစား page အစစ်နဲ့ ချိတ်ထားတယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Foreign key နဲ့ `on delete set null`
`products.category_id` က `categories.id` ကို ညွှန်ပြတယ် (foreign key)။ မရှိတဲ့ category id ကို ထည့်ရင် database က လက်မခံဘူး။ `on delete set null` ပါလို့ category ကို ဖျက်ရင် ညွှန်ပြနေတဲ့ product တွေမှာ `null` ဖြစ်သွားတယ်။
(နှိုင်းယှဉ်ရန်: `stock_movements` မှာ `on delete cascade` သုံးထားတယ်။ Product ကို ဖျက်ရင် သူ့ movement တွေပါ အကုန် ပျက်သွားတယ်။)

### 2. Embedded select (join) — `category:categories(id, name)`
SQL မှာ `join` ရေးရမယ့်အစား Supabase မှာ select string ထဲမှာ table နာမည် ထည့်ရုံပဲ။ Product တစ်ခုချင်းစီမှာ `category: { id, name }` object ပါလာတယ်။ `category:` က ရလာတဲ့ field ကို နာမည်ပေးတာ (alias) ဖြစ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `supabase_flutter` မှာလည်း `.select('*, category:categories(id, name)')` ဆိုပြီး အတူတူပဲ ရေးတယ်။ ရလာတဲ့ JSON ကို `Product.fromJson` ထဲမှာ `json['category']` နဲ့ ဖတ်တာ ဖြစ်တယ်။

### 3. Aggregate count — `products(count)`
Category တစ်ခုစီမှာ product တွေ အကုန် download မလုပ်ဘဲ အရေအတွက်ပဲ ယူတယ်။ ရလာတာက `products: [{ count: 6 }]` ပုံစံ ဖြစ်လို့ `[0].count` နဲ့ ထုတ်ယူတယ်။

### 4. Props ကနေ initial state ယူခြင်း + `key`
`useState(initial?.name ?? '')` က component ပထမဆုံး ပေါ်တဲ့အချိန်မှာပဲ initial value ကို သုံးတယ်။ နောက်ပိုင်း `initial` ပြောင်းလည်း state မပြောင်းဘူး။ ဒါကြောင့် ProductsPage မှာ `key={editing?.id}` ထည့်ထားတယ်။ တခြား product ကို edit နှိပ်ရင် key ပြောင်းလို့ form အသစ် (state အသစ်) ဖြစ်သွားတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `TextEditingController(text: product.name)` ကို `initState()` ထဲမှာ ဖန်တီးတာနဲ့ တူတယ်။ Widget အသစ် လိုချင်ရင် `ValueKey(product.id)` ပေးတာနဲ့ အတူတူပဲ။

### 5. Controlled `<select>` နဲ့ `null`
HTML `<select>` value က string ပဲ ဖြစ်ရတယ်။ ဒါကြောင့် "No category" ကို `''` နဲ့ ပြပြီး save လုပ်ချိန်မှာ `categoryId || null` နဲ့ database အတွက် `null` ပြောင်းတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `DropdownButton<String?>` မှာ `value: null` ကို "No category" အဖြစ် သုံးတာနဲ့ တူတယ်။

### 6. Component တစ်ခုကို နေရာ ၂ ခုမှာ ပြန်သုံးခြင်း
`CategoryNameForm` က Add (အလွတ်) နဲ့ Rename (နာမည်ဟောင်း ဖြည့်ပြီးသား) ၂ ခုလုံးအတွက် သုံးတယ်။ ကွာတာက props (`initialName`၊ `submitLabel`၊ `onSubmit`) ပဲ။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** Constructor parameter မတူတာနဲ့ widget တစ်ခုတည်းကို ၂ နေရာမှာ သုံးတာနဲ့ တူတယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. "Snacks" category ကို ဖျက်လိုက်ရင် Chocolate bar product က ဘာဖြစ်မလဲ။ ဘယ် SQL အပိုင်းက အဲ့ဒါကို ဆုံးဖြတ်တာလဲ။
2. Product ကို Edit လုပ်တဲ့အခါ stock field ကို ဘာကြောင့် ဖျောက်ထားတာလဲ။ Stock ပြောင်းချင်ရင် ဘာလုပ်ရမလဲ။
3. ProductsPage မှာ `<ProductForm key={editing?.id ?? 'new'} ... />` ထဲက `key` ကို ဖြုတ်လိုက်ရင် Product A ကို edit ဖွင့်ပြီး Product B ကို Edit နှိပ်တဲ့အခါ form မှာ ဘာပေါ်မလဲ။
