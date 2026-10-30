# Phase 11 — Suppliers (ပစ္စည်းပေးသွင်းသူ)

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**ရလဒ်:**
- **Suppliers** page အသစ် ရှိလာတယ်။ Owner က supplier (နာမည်၊ ဆက်သွယ်ရမယ့်သူ၊ email၊ ဖုန်း) ကို ထည့်၊ ပြင်၊ ဖျက်လို့ရတယ်။ Staff က ကြည့်ရုံပဲ။
- Product form မှာ **Supplier** select ပါလာတယ်။
- Products table မှာ **Supplier** column ပါလာတယ်။
- Supplier ကို ဖျက်ရင် product တွေ မပျက်ဘူး။ Supplier ဗလာ ဖြစ်သွားရုံပဲ။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **Categories နဲ့ ပုံစံ အတူတူ လိုက်လုပ်တယ်။** `org_id default current_org_id()`၊ RLS၊ column privilege၊ `owners:` policy၊ နာမည် တူတာ မရ (`lower(name)`) စတာတွေ အားလုံး တူတယ်။ ပုံစံ တစ်မျိုးတည်း ဖြစ်လို့ code ဖတ်ရ လွယ်တယ်၊ အမှား နည်းတယ်။
- **Composite foreign key `(supplier_id, org_id)`:** Product တစ်ခုက တခြားဆိုင်ရဲ့ supplier ကို ညွှန်လို့ မရဘူး။ `on delete set null (supplier_id)` က supplier ဖျက်ရင် `supplier_id` တစ်ခုတည်းကိုပဲ null လုပ်တယ်။
- **Email၊ ဖုန်း၊ contact က optional ဖြစ်တယ်။** ဆိုင်သေးတွေမှာ supplier နာမည်ပဲ သိတာ များတယ်။ Form မှာ ဗလာ ထားရင် `null` အဖြစ် သိမ်းတယ် (`''` မဟုတ်ဘူး)။ ဒါကြောင့် "မရှိဘူး" ဆိုတာ တစ်မျိုးတည်းပဲ ရှိတယ်။
- **Constraint ကို `do $$ … exception when duplicate_object` ထဲမှာ ထည့်တယ်။** Postgres မှာ `add constraint if not exists` မရှိဘူး။ File ကို ဒုတိယအကြိမ် run ရင် "already exists" error တက်မယ်။ ဒါကြောင့် အဲဒီ error ကို ဖမ်းပြီး ကျော်တယ်။ (Enum type မှာ သုံးခဲ့တဲ့ နည်းနဲ့ အတူတူပဲ။)
- **Supplier table ကို `schema.sql` ရဲ့ section 2 (categories နားမှာ) ထည့်တယ်။** နောက်ဆုံးမှာ ထည့်ရင် section 5 ရဲ့ `grant (… supplier_id …)` က column မရှိသေးခင် run ပြီး database အသစ်မှာ error တက်မယ်။ အစီအစဉ်က အရေးကြီးတယ်။

## File တစ်ခုချင်းစီ

**`supabase/schema.sql` (ပြင်တယ်)**
- Section 2: `suppliers` table
- Section 3: `products.supplier_id` နဲ့ composite FK
- Section 5: column grant
- Section 6: RLS policy

**`supabase/seed.sql` (ပြင်တယ်)**
Supplier ၃ ခု ထည့်တယ်။ SKU ရှေ့ဆုံးစာလုံး (`BEV`၊ `SNK`၊ `HOM`၊ `PER`) နဲ့ product တွေကို ချိတ်ပေးတယ်။

**`src/services/suppliers.ts` (အသစ်)**
`listSuppliers` (product အရေအတွက်ပါ)၊ `createSupplier`၊ `updateSupplier`၊ `deleteSupplier` ပါတယ်။ Update/delete က `requireChanged` နဲ့ RLS ပိတ်ထားတာကို စစ်တယ်။

**`src/pages/SuppliersPage.tsx` (အသစ်)**
Supplier table (email ကို နှိပ်ရင် mail app၊ ဖုန်းကို နှိပ်ရင် ဖုန်းခေါ်) ပြတယ်။ Supplier နာမည်ကို နှိပ်ရင် အဲဒီ supplier ရဲ့ product တွေကို ပြတယ် (`/products?supplier=<id>`)။ Owner အတွက် Add/Edit form နဲ့ Delete ပါတယ်။

**Supplier filter:** Products page မှာ Category select ဘေးမှာ Supplier select ပါလာတယ်။ Filter နှစ်ခုကို တွဲသုံးလို့ရတယ်။ `listProducts` က `{ category, supplier }` object ကို လက်ခံတယ်။

**`src/components/ProductForm.tsx`၊ `src/pages/ProductsPage.tsx`၊ `src/services/products.ts`၊ `src/types.ts`၊ `src/App.tsx` (ပြင်တယ်)**
Supplier select၊ Supplier column၊ `supplier:suppliers(id, name)` join၊ `Supplier` type တွေ ထည့်တယ်။ `/suppliers` route ကို ချိတ်တယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. `Promise.all` နဲ့ တစ်ပြိုင်နက် load လုပ်ခြင်း
Product form က category နဲ့ supplier နှစ်ခုလုံးကို တစ်ပြိုင်နက် ယူတယ်: `Promise.all([listCategories(), listSuppliers()])`။ တစ်ခုပြီးမှ တစ်ခု စောင့်ရင် နှစ်ဆ ကြာတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `await Future.wait([listCategories(), listSuppliers()])` နဲ့ အတူတူပဲ။

### 2. `Pick<Type, keys>` နဲ့ type အသစ် ဆောက်ခြင်း
`SupplierInput = Pick<Supplier, 'name' | 'contact_name' | 'email' | 'phone'>` က `Supplier` ထဲက field ၄ ခုကိုပဲ ယူတယ်။ `Supplier` ပြောင်းရင် `SupplierInput` လည်း အလိုအလျောက် လိုက်ပြောင်းတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** Dart မှာ ဒီလို feature မရှိဘူး။ Class အသစ် သီးသန့် ရေးရတယ်။

### 3. `''` နဲ့ `null`
`contactName.trim() || null`: string ဗလာ (`''`) က falsy ဖြစ်လို့ `null` ဖြစ်သွားတယ်။ Database မှာ "မရှိ" ကို `null` တစ်မျိုးတည်းနဲ့ သိမ်းတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `contact.trim().isEmpty ? null : contact.trim()` နဲ့ အတူတူပဲ။

### 4. `mailto:` နဲ့ `tel:` link
`<a href="mailto:…">` က email app ကို ဖွင့်တယ်။ `<a href="tel:…">` က ဖုန်းမှာဆိုရင် ဖုန်းခေါ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `url_launcher` package ရဲ့ `launchUrl(Uri.parse('tel:…'))` နဲ့ ဆင်တူတယ်။ Web မှာတော့ package မလိုဘူး။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. Supplier "Golden Beverage Co." ကို ဖျက်ရင် အဲဒီ supplier ရဲ့ product တွေမှာ ဘာဖြစ်မလဲ။ ဘယ် rule က ဆုံးဖြတ်တာလဲ။
2. `alter table products add constraint …` ကို `do $$ … exception …` ထဲ မထည့်ဘဲ ရေးခဲ့ရင် `schema.sql` ကို ဒုတိယအကြိမ် run တဲ့အခါ ဘာဖြစ်မလဲ။
3. Staff က console ကနေ `createSupplier({ name: 'Test', contact_name: null, email: null, phone: null })` ကို ခေါ်ရင် ဘာ error ပေါ်မလဲ။ ဘယ်နေရာက တားတာလဲ။
