# Phase 10b — Product image (ကုန်ပစ္စည်း ဓာတ်ပုံ)

> မူလ roadmap မှာ product image ကို "မလုပ်ဘူး" (Exclude) လို့ ထားခဲ့တယ်။ နောက်မှ ထည့်ဖို့ ဆုံးဖြတ်ခဲ့တယ်: product တစ်ခုကို ပုံ **တစ်ပုံ**၊ **public** bucket မှာ သိမ်းမယ်။

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**Workflow:**
1. Product form မှာ **Upload image** နှိပ်ပြီး ဓာတ်ပုံ ရွေးတယ်။ Preview ချက်ချင်း ပေါ်တယ်။
2. **Save** နှိပ်မှ ပုံကို Supabase Storage ပေါ် တင်တယ်။ Cancel နှိပ်ရင် ဘာမှ မတင်ဘူး။
3. Products table မှာ ပုံသေးလေး (thumbnail) ပေါ်တယ်။ ပုံမရှိရင် မီးခိုးရောင် icon ပြတယ်။
4. **Change image** နဲ့ ပုံပြောင်းလို့ရတယ်၊ **Remove** နဲ့ ဖြုတ်လို့ရတယ်။ ပုံဟောင်း file ကို Storage ကနေ ဖျက်ပေးတယ်။ Product ကို ဖျက်ရင်လည်း သူ့ပုံ file ကို ဖျက်တယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **Browser ထဲမှာ ပုံကို အရင် ချုံ့တယ်** (အများဆုံး 800×800၊ WebP)။ ဖုန်းဓာတ်ပုံတွေက 3–5 MB ရှိတတ်တယ်။ ချုံ့လိုက်ရင် 100–200 KB လောက်ပဲ ကျန်လို့ upload မြန်တယ်၊ table load မြန်တယ်၊ storage လည်း ချွေတာတယ်။ Library မသုံးဘဲ `<canvas>` နဲ့ပဲ လုပ်တယ်။
- **Upload တိုင်း file နာမည် အသစ် ပေးတယ်** (`<product_id>/<random>.webp`)။ Supabase က ပုံတွေကို CDN မှာ cache လုပ်ထားတယ်။ နာမည်တူနဲ့ ပုံအသစ် တင်ရင် ပုံဟောင်းကို ဆက်ပြနေနိုင်တယ်။ Test လုပ်ကြည့်တော့ ဖျက်ပြီးသား file ကိုတောင် CDN က ခဏ ဆက်ပြနေတာ တွေ့ရတယ် (`cf-cache-status: HIT`)။
- **Public bucket:** ပုံ URL ကို သိတဲ့သူ ဘယ်သူမဆို ကြည့်လို့ရတယ်။ URL မှာ random နာမည် ပါလို့ ခန့်မှန်းလို့ မရဘူး။ Product ဓာတ်ပုံဆိုတော့ လျှို့ဝှက်ချက် မဟုတ်ဘူး။ ဒါကြောင့် ရိုးရှင်းတဲ့ public bucket ကို ရွေးခဲ့တယ်။
- **Database မှာ ပုံ file ကိုယ်တိုင် မသိမ်းဘဲ path ပဲ သိမ်းတယ်** (`products.image_path`)။ File တွေကို Storage မှာ သိမ်းပြီး database မှာ "ဘယ်နေရာမှာ ရှိလဲ" ပဲ မှတ်ထားတာ ဖြစ်တယ်။
- **အမှားဖြစ်ရင် ဘယ်လို ကိုင်တွယ်လဲ:**
  - ပုံ upload ပြီးမှ database update မအောင်မြင်ရင် ပုံအသစ်ကို ပြန်ဖျက်တယ် (undo)။
  - Product **အသစ်** save ပြီးမှ ပုံ upload မအောင်မြင်ရင် form ကို ပိတ်ပြီး "Product saved, but image not…" လို့ ပြောတယ်။ Form ဖွင့်ထားရင် Save ထပ်နှိပ်တဲ့အခါ "SKU already exists" error တက်မှာမို့လို့ ဖြစ်တယ်။

## File တစ်ခုချင်းစီ

**`src/lib/resizeImage.ts` (အသစ်)**
ဓာတ်ပုံကို `<canvas>` ပေါ်မှာ ဆွဲပြီး သေးအောင် ပြန်ထုတ်တယ်။ WebP မထုတ်ပေးနိုင်တဲ့ browser မှာ JPEG နဲ့ ထုတ်တယ်။ ဖုန်းဓာတ်ပုံ လှည့်နေတာ (EXIF rotation) ကိုလည်း မှန်အောင် ပြင်ပေးတယ်။

**`src/services/productImages.ts` (အသစ်)**
Storage နဲ့ ဆက်သွယ်တဲ့ function ၃ ခု ပါတယ်: upload (path ပြန်ပေးတယ်)၊ delete၊ public URL တည်ဆောက်ခြင်း။ Supabase ကို ခေါ်တာမို့ `services/` ထဲမှာ ထားတယ် (CLAUDE.md စည်းကမ်း)။

**`src/components/ProductImage.tsx` (အသစ်)**
ပုံ ဒါမှမဟုတ် ပုံမရှိရင် placeholder icon ကို ပြတယ်။ Table (`size-10`) နဲ့ form (`size-24`) နှစ်နေရာလုံးမှာ သုံးတယ်။

**`src/services/products.ts` (ပြင်တယ်)**
`createProduct` က id အသစ်ကို ပြန်ပေးတယ် (ပုံ upload လုပ်ဖို့ လိုလို့)။ `setProductImage` က form ရဲ့ ပုံပြောင်းလဲမှုကို အကောင်အထည်ဖော်တယ်။ `deleteProduct` က ပုံ file ကိုပါ ဖျက်တယ်။

**`src/components/ProductForm.tsx`၊ `src/pages/ProductsPage.tsx`၊ `src/types.ts` (ပြင်တယ်)**
Form မှာ image box ထည့်ထားတယ်။ Table မှာ thumbnail ထည့်ထားတယ်။ `ImageChange` type (`keep` / `set` / `remove`) ကို ထည့်ထားတယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Supabase Storage နဲ့ bucket
Bucket ဆိုတာ file တွေ ထည့်တဲ့ folder ကြီး ဖြစ်တယ်။ Bucket မှာ size limit (2 MB) နဲ့ ခွင့်ပြုတဲ့ file အမျိုးအစား (JPEG/PNG/WebP) ကို သတ်မှတ်ထားတယ်။ PDF ကို စမ်းတင်ကြည့်တော့ `invalid_mime_type` နဲ့ ငြင်းတယ်။ File တွေရဲ့ ခွင့်ပြုချက်ကို `storage.objects` table ပေါ်က RLS policy နဲ့ ထိန်းတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `supabase_flutter` မှာ `supabase.storage.from('product-images').upload(path, file)` နဲ့ အတူတူပဲ။

### 2. `<input type="file">` နဲ့ `File` / `Blob`
User ရွေးလိုက်တဲ့ file ကို `e.target.files[0]` ကနေ ယူတယ်။ `File` ဆိုတာ နာမည်ပါတဲ့ `Blob` (binary data) ဖြစ်တယ်။ ပြီးရင် `e.target.value = ''` နဲ့ ပြန်ရှင်းတယ်။ မရှင်းရင် file တစ်ခုတည်းကို ထပ်ရွေးတဲ့အခါ `onChange` ထပ် မဖြစ်ဘူး။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `image_picker` package ရဲ့ `ImagePicker().pickImage()` နဲ့ ရလာတဲ့ `XFile` နဲ့ တူတယ်။

### 3. `URL.createObjectURL` (preview) နဲ့ `revokeObjectURL`
Upload မလုပ်ခင် ပုံကို ပြဖို့ browser memory ထဲက blob ကို `blob:` URL အနေနဲ့ ယာယီ ဖန်တီးတယ်။ မလိုတော့ရင် `revokeObjectURL` နဲ့ memory ကို ပြန်လွှတ်ရတယ်။ ဒါကို `useEffect` ရဲ့ cleanup ထဲမှာ လုပ်ထားတယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `Image.memory(bytes)` နဲ့ ပြတာနဲ့ ဆင်တူတယ်။ Cleanup က `dispose()` ထဲမှာ controller ကို dispose လုပ်တာနဲ့ တူတယ်။

### 4. Discriminated union type (`ImageChange`)
`{ type: 'keep' } | { type: 'set'; image: Blob } | { type: 'remove' }` လို type ကို ရေးထားတယ်။ `type` ကို စစ်လိုက်တာနဲ့ TypeScript က `image` ရှိ/မရှိ ကို သိသွားတယ်။ `'set'` ဖြစ်မှပဲ `change.image` ကို သုံးခွင့်ပေးတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** Dart 3 ရဲ့ `sealed class ImageChange` နဲ့ `Keep`၊ `Set(image)`၊ `Remove` subclass တွေ၊ `switch` pattern matching နဲ့ အတူတူပဲ။

### 5. CDN cache
Public file တွေကို ကမ္ဘာအနှံ့က server (CDN) တွေမှာ cache လုပ်ထားလို့ မြန်တယ်။ ဒါပေမယ့် file ကို ပြင်ရင်/ဖျက်ရင် ခဏကြာအောင် ပုံဟောင်း ဆက်ပေါ်နေနိုင်တယ်။ ဖြေရှင်းနည်းက **file နာမည် အသစ်** ပေးတာပဲ။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. ပုံကို database ထဲမှာ တိုက်ရိုက် မသိမ်းဘဲ Storage မှာ သိမ်းပြီး database မှာ `image_path` ပဲ ဘာကြောင့် သိမ်းတာလဲ။
2. ပုံပြောင်းတိုင်း file နာမည် အသစ် (random) ဘာကြောင့် ပေးတာလဲ။ နာမည်တူ (ဥပမာ `<product_id>.webp`) ကို ထပ်ရေး (overwrite) ရင် ဘာပြဿနာ ဖြစ်နိုင်လဲ။
3. 4 MB ရှိတဲ့ ဖုန်းဓာတ်ပုံကို ရွေးလိုက်ရင် bucket ရဲ့ 2 MB limit ကို ဘာကြောင့် မကျော်တော့တာလဲ။
