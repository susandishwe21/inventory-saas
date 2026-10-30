# Phase 13 — Product ရှာခြင်း (Search)

## ဘာတွေ လုပ်ခဲ့လဲ၊ ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ

**ရလဒ်:** Products page ရဲ့ filter bar မှာ search box ရှိလာတယ်။
- "cola" ဒါမှမဟုတ် "bev-1" ရိုက်ရင် **နာမည် ဒါမှမဟုတ် SKU** ထဲမှာ ပါတာကို ရှာတယ်။ စာလုံးကြီး/သေး မခွဲဘူး။
- စာရိုက်ပြီး **300ms ရပ်မှ** ရှာတယ်။
- ရှာတဲ့ စာက URL (`?q=cola`) မှာ ရှိတယ်။ Category/Supplier filter နဲ့ တွဲသုံးလို့ရတယ်။
- Esc ဒါမှမဟုတ် ✕ ကို နှိပ်ရင် ရှင်းတယ်။

**ဘာကြောင့် ဒီလို design လုပ်ခဲ့လဲ:**
- **Debounce (300ms စောင့်):** "cola" ရိုက်ရင် key ၄ ချက် ရှိတယ်။ Key တိုင်းမှာ ရှာရင် database ကို request ၄ ခု ပို့ရမယ်။ အဖြေ ဟောင်းက နောက်မှ ရောက်လာရင် မှားပြီး ပြနိုင်တယ်။ ရပ်မှ ရှာရင် request တစ်ခုပဲ ပို့ရတယ်။
- **Database မှာ ရှာတယ် (`ilike`)။** Browser မှာ ရှာရင် လက်ရှိ page ၁၀ ခုထဲကပဲ ရှာနိုင်မယ်။ Database မှာ ရှာမှ product အားလုံးထဲက ရှာပြီး pagination နဲ့ "N products" အရေအတွက် မှန်မယ်။
- **User ရိုက်တဲ့ စာကို "escape" လုပ်တယ်။**
  - Supabase ရဲ့ `.or('name.ilike.…,sku.ilike.…')` က `,` `(` `)` တွေနဲ့ filter တွေကို ခွဲတယ်။ User က `a,b(` လို့ ရိုက်ရင် filter ပျက်သွားမယ်။ ဒါကြောင့် စာကို `"…"` (double quote) ထဲ ထည့်တယ်။
  - `%` နဲ့ `_` က LIKE မှာ "ဘာမဆို" လို့ အဓိပ္ပာယ် ရှိတယ်။ User က "50%" ရှာရင် "50" နဲ့ စတာ အကုန် ထွက်လာမယ်။ ဒါကြောင့် `\%` လို့ ပြောင်းပြီး စာလုံးအတိုင်း ရှာခိုင်းတယ်။
  - ဒါတွေကို database နဲ့ တကယ် စမ်းခဲ့တယ်: `a,b(`၊ `)`၊ `"quoted"`၊ `\`၊ `50%`၊ `a_b` အားလုံး error မတက်ဘူး။
- **URL ကို `replace` နဲ့ ပြောင်းတယ်။** ရှာတိုင်း browser history အသစ် မထည့်ဘူး။ ဒါကြောင့် Back ခလုတ် နှိပ်ရင် ရှာခဲ့တဲ့ စာ တစ်ခုချင်းစီကို ပြန်မသွားဘဲ ယခင် page ကို တန်းရောက်တယ်။
- **SearchBox ကို component သီးသန့် လုပ်တယ်။** ရိုက်နေတဲ့ စာ (`text`) နဲ့ ရှာပြီးသား စာ (URL ရဲ့ `q`) ကွဲတယ်။ Box က key တိုင်းမှာ ချက်ချင်း ပြောင်းရမယ်။ ရှာတာကတော့ 300ms နောက်မှ ဖြစ်တယ်။

## File တစ်ခုချင်းစီ

**`src/components/SearchBox.tsx` (အသစ်)**
Debounce ပါတဲ့ search input ဖြစ်တယ်။ ရပ်ပြီး 300ms ကြာမှ `onSearch(text)` ကို ခေါ်တယ်။ URL ကနေ ပြောင်းရင် (Back ခလုတ်၊ Clear filters) box ထဲက စာလည်း လိုက်ပြောင်းတယ်။

**`src/services/products.ts` (ပြင်တယ်)**
`ProductFilters` မှာ `search` ထည့်တယ်။ `containsPattern()` က user ရိုက်တဲ့ စာကို လုံခြုံတဲ့ pattern ဖြစ်အောင် ပြောင်းတယ်။

**`src/pages/ProductsPage.tsx` (ပြင်တယ်)**
`?q=` ကို ဖတ်တယ်။ ရှာရင် page 1 ကို ပြန်သွားတယ်။ Header မှာ `matching "cola"` ပြတယ်။ ရလဒ် မရှိရင် `No products match "xyz".` ပြတယ်။

**`src/components/icons.tsx` (ပြင်တယ်)**
`search` icon ထည့်တယ်။

## သင်ယူရတဲ့ concept အသစ်တွေ

### 1. Debounce
Event အများကြီး ဆက်တိုက် လာရင် နောက်ဆုံး တစ်ခုပြီး အချိန်အတိုင်းအတာ တစ်ခု ကြာမှ အလုပ်လုပ်တယ်။ Key တိုင်းမှာ timer အဟောင်းကို ဖျက်ပြီး (`clearTimeout`) အသစ် ပြန်စတယ်။
**Dart နဲ့ နှိုင်းယှဉ်ရင်:** `Timer? _debounce; _debounce?.cancel(); _debounce = Timer(Duration(milliseconds: 300), () => search(text));` နဲ့ အတူတူပဲ။

### 2. `useRef`: render မဖြစ်စေဘဲ တန်ဖိုး သိမ်းခြင်း
Timer id ကို `useRef` ထဲ သိမ်းတယ်။ `useState` နဲ့ မတူတာက `ref.current` ပြောင်းရင် component ပြန် render မဖြစ်ဘူး။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `State` class ထဲက ရိုးရိုး field (`Timer? _debounce;`) နဲ့ တူတယ်။ `setState` မခေါ်ဘဲ ပြောင်းတာမျိုး ဖြစ်တယ်။

### 3. Prop ပြောင်းရင် state ကို လိုက်ပြောင်းခြင်း
`if (value !== prevValue) { setPrevValue(value); setText(value); }`: render လုပ်နေတုန်း prop အသစ်ကို တွေ့ရင် state ကို ချက်ချင်း ပြင်တယ်။ `useEffect` ထဲမှာ ပြင်တာထက် ပိုမြန်တယ်။ ဒါဟာ React က အကြံပြုတဲ့ နည်း ဖြစ်တယ်။
**Flutter နဲ့ နှိုင်းယှဉ်ရင်:** `didUpdateWidget(oldWidget)` မှာ `if (widget.value != oldWidget.value) _controller.text = widget.value;` လုပ်တာနဲ့ ဆင်တူတယ်။

### 4. Input ကို escape လုပ်ခြင်း
User ရိုက်တဲ့ စာကို query ထဲ တိုက်ရိုက် မထည့်ရဘူး။ အထူး အဓိပ္ပာယ်ရှိတဲ့ စာလုံးတွေ (`,` `(` `%` `"`) ကြောင့် query ပျက်နိုင်တယ်၊ ဒါမှမဟုတ် အဓိပ္ပာယ် ပြောင်းသွားနိုင်တယ်။ SQL injection နဲ့ အခြေခံ အတူတူပဲ။

## နားလည်မှု စစ်ဆေးဖို့ မေးခွန်း ၃ ခု

1. Debounce မပါရင် "chocolate" ရိုက်တဲ့အခါ database ကို request ဘယ်နှခု ပို့မလဲ။ ဘာပြဿနာ ဖြစ်နိုင်လဲ။
2. User က `50%` လို့ ရှာတယ်။ `%` ကို escape မလုပ်ရင် ဘယ် product တွေ ထွက်လာမလဲ။
3. Search ကို browser ထဲမှာ (`products.filter(...)`) လုပ်ရင် page 2 ထဲက product တွေမှာ ဘာဖြစ်မလဲ။
