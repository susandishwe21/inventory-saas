# Phase 5 — ဆိုင်အလိုက် Product၊ Category၊ Stock Movement (Data reset)

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**ရလဒ်:** ဆိုင်တစ်ဆိုင်က ကိုယ့်ဆိုင်ရဲ့ product၊ category၊ stock movement နဲ့ ပုံတွေကိုပဲ မြင်ရတယ်၊ ပြင်ရတယ်။ SKU တူတာကို ဆိုင်နှစ်ဆိုင်မှာ သုံးလို့ရတယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **Row တိုင်းမှာ `org_id` ပါတယ်။** Default က `current_org_id()` ဖြစ်တယ်။ App က `org_id` ကို ပို့စရာ မလိုဘူး။ Column privilege နဲ့ ပိတ်ထားလို့ ပို့ချင်ရင်တောင် မရဘူး။ ဒါကြောင့် တခြားဆိုင်ထဲကို row ထည့်ဖို့ မဖြစ်နိုင်ဘူး။
- **RLS policy တိုင်းက `org_id = current_org_id()` ဖြစ်တယ်။** Browser က ဘယ်လို query ပဲ ပို့ပို့ database က ကိုယ့်ဆိုင် row တွေကိုပဲ ပြန်ပေးတယ်။
- **Composite foreign key (`(category_id, org_id)`):** Product တစ်ခုက **တခြားဆိုင်ရဲ့ category** ကို ညွှန်လို့ မရအောင် database က စစ်တယ်။ Category id တစ်ခုတည်း မဟုတ်ဘဲ "id + ဆိုင်" တွဲလျက် ကိုက်ညီရမယ်။ Stock movement → product မှာလည်း အတူတူပဲ။
- **Stock ကို trigger ကပဲ ပြောင်းတယ်။** Movement အသစ် ထည့်တိုင်း `apply_stock_movement()` က `stock_quantity` ကို ပေါင်း/နုတ်တယ်။ App က `stock_quantity` ကို ရေးခွင့် မရှိဘူး (column privilege)။ Stock ထက် ပိုရောင်းရင် `check (stock_quantity >= 0)` က ငြင်းပြီး movement တစ်ခုလုံး rollback ဖြစ်တယ်။ ဒါကြောင့် "Not enough stock" ပေါ်တယ်။
- **`created_by default auth.uid()`:** Movement တိုင်းမှာ ဘယ်သူ မှတ်ခဲ့လဲ ဆိုတာ အလိုအလျောက် ပါတယ်။ App က ပို့လို့ မရလို့ အတုလုပ်လို့လည်း မရဘူး။ Phase 16 (Stock history) မှာ သုံးမယ်။
- **ပုံ path က `<org_id>/<product_id>/<random>.webp` ဖြစ်တယ်။** Storage policy က ပထမ folder (`org_id`) ကို စစ်ပြီး ကိုယ့်ဆိုင် folder ထဲမှာပဲ upload/ဖျက် ခွင့်ပေးတယ်။
- **"Opening stock" field ကို ဖြုတ်လိုက်တယ်။** ယခင်က product create လုပ်တဲ့အခါ `stock_quantity` ကို တိုက်ရိုက် ရေးနေခဲ့တယ်။ ဒါက "stock ကို movement နဲ့ပဲ ပြောင်းရမယ်" ဆိုတဲ့ စည်းကမ်းကို ချိုးဖောက်တယ်။ အခု product အသစ်က 0 နဲ့ စတယ်။ **Stock** ခလုတ်ကနေ `in` movement ထည့်ရတယ်။
- **`schema.sql` ကို အစကနေ ပြန်ရေးလိုက်တယ်။** အရင်က phase တစ်ခုချင်းစီရဲ့ patch တွေ ဆက်တိုက် ဖြစ်နေခဲ့တယ်။ အခု အစီအစဉ်တကျ (ဆိုင် → category → product → movement → privilege → RLS → storage) ဖြစ်ပြီး file တစ်ခုလုံးကို ဘယ်အချိန် ပြန် run ရင်လည်း အန္တရာယ် မရှိဘူး (idempotent)။
- **Data reset (`drop table`) ကို `schema.sql` ထဲ မထည့်ဘူး။** ထည့်ထားရင် file ကို ပြန် run တိုင်း data အကုန် ပျက်သွားမှာ ဖြစ်တယ်။

## File တစ်ခုချင်းစီ

**`supabase/schema.sql` (ပြန်ရေးတယ်)**
Database တစ်ခုလုံးရဲ့ နောက်ဆုံး ပုံစံ ဖြစ်တယ်။ အပိုင်း ၇ ပိုင်း ပါတယ်။ Table တိုင်းမှာ `org_id`၊ RLS နဲ့ column privilege ရှိတယ်။ Stock trigger လည်း ပါတယ်။

**`supabase/seed.sql` (ပြန်ရေးတယ်)**
အပေါ်ဆုံးမှာ email ထည့်လိုက်ရင် အဲဒီ owner ရဲ့ ဆိုင်ထဲကို category ၅ ခု၊ product ၂၀ နဲ့ "Opening stock" movement တွေ ထည့်ပေးတယ်။ SQL Editor က `postgres` အနေနဲ့ run လို့ `current_org_id()` က ဗလာ ဖြစ်နေတယ်။ ဒါကြောင့် `org_id` ကို ကိုယ်တိုင် ထည့်ပေးရတယ်။

**`src/services/products.ts` (ပြင်တယ်)**
`createProduct` က `id`၊ `org_id` ကို ပြန်ပေးတယ်။ `setProductImage(product, change)` က product ရဲ့ `org_id` ကို ပုံ path အတွက် သုံးတယ်။ `addStockMovement` က stock မလောက်ရင် "Not enough stock" ပြတယ်။

**`src/services/productImages.ts` (ပြင်တယ်)**
Upload path က `orgId/productId/random` ဖြစ်သွားတယ်။

**`src/components/ProductForm.tsx`၊ `src/pages/ProductsPage.tsx`၊ `src/types.ts`၊ `src/services/categories.ts` (ပြင်တယ်)**
Opening stock field ကို ဖြုတ်တယ်။ Type တွေမှာ `org_id`၊ `created_by` ထည့်တယ်။ `ProductInput` ကနေ `stock_quantity` ကို ဖယ်တယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Tenant isolation ကို database မှာ လုပ်ခြင်း
"ကိုယ့်ဆိုင် data ပဲ ပြ" ဆိုတာကို React code မှာ `.eq('org_id', ...)` နဲ့ မလုပ်ဘဲ RLS နဲ့ database မှာ လုပ်တယ်။ App code မှာ filter မေ့သွားရင်တောင် data မပေါက်ကြားဘူး။
**Flutter/Firebase နဲ့ နှိုင်းယှဉ်ရင်:** Firestore Security Rules မှာ `allow read: if resource.data.orgId == getUserOrg()` ရေးတာနဲ့ အတူတူပဲ။

### 2. Database trigger
Table ထဲ row ထည့်/ပြင်/ဖျက်တဲ့အခါ အလိုအလျောက် run တဲ့ function ဖြစ်တယ်။ ဒီမှာ movement ထည့်တာနဲ့ stock ပြောင်းတယ်။ Movement ထည့်တာနဲ့ stock ပြောင်းတာက transaction တစ်ခုတည်း ဖြစ်လို့ တစ်ခုပဲ ဖြစ်ပြီး ကျန်တစ်ခု မဖြစ်တာမျိုး မရှိဘူး။
**Firebase နဲ့ နှိုင်းယှဉ်ရင်:** Cloud Functions ရဲ့ `onDocumentCreated` trigger နဲ့ ဆင်တူတယ်။ ဒါပေမယ့် Postgres trigger က transaction ထဲမှာပဲ ချက်ချင်း run တယ်။

### 3. Column privileges (`grant insert (col1, col2)`)
RLS က "ဘယ် **row** တွေကို" ထိန်းတယ်။ Column privilege က "ဘယ် **column** တွေကို" ရေးခွင့်ရှိလဲ ထိန်းတယ်။ နှစ်ခု ပေါင်းသုံးတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** Class မှာ `final int stockQuantity;` (ပြင်မရ) နဲ့ ရိုးရိုး field (ပြင်ရ) ခွဲထားတာနဲ့ ဆင်တူတယ်။ ဒီမှာတော့ database ကိုယ်တိုင်က စောင့်ကြည့်တယ်။

### 4. Composite foreign key
FK တစ်ခုမှာ column နှစ်ခု သုံးတယ်: `(category_id, org_id) references categories (id, org_id)`။ "ဒီ category ရှိရမယ်" အပြင် "**ဒီဆိုင်ထဲမှာ** ရှိရမယ်" ဆိုတာကိုပါ စစ်တယ်။ `on delete set null (category_id)` က category ဖျက်တဲ့အခါ `category_id` တစ်ခုတည်းကိုပဲ null လုပ်တယ်။ `org_id` မပျက်ဘူး။

### 5. Data-modifying CTE (`with ... insert ... returning`)
`seed.sql` မှာ product တွေ insert လုပ်ပြီး `returning id` နဲ့ ရလာတဲ့ id တွေကို နောက် insert (movement) မှာ ချက်ချင်း သုံးတယ်။ Statement တစ်ခုတည်းနဲ့ ပြီးတယ်။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. App က product insert လုပ်တဲ့အခါ `org_id` ကို မပို့ဘူး။ ဒါဆို database က ဘယ်ဆိုင် row လို့ ဘယ်လို သိတာလဲ။ App က တခြားဆိုင်ရဲ့ `org_id` ကို ပို့ကြည့်ရင် ဘာဖြစ်မလဲ။
2. Stock 5 ခုပဲ ရှိတဲ့ product ကို `out` 10 ခု ထည့်ရင် ဘယ်နေရာက တားတာလဲ။ Movement row က table ထဲ ကျန်ခဲ့သလား။
3. Product တစ်ခုရဲ့ `category_id` ကို **တခြားဆိုင်** ရဲ့ category id နဲ့ update လုပ်ကြည့်ရင် ဘာဖြစ်မလဲ။ ဘယ် rule က တားတာလဲ။
