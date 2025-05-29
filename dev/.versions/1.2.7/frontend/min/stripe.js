vweb.payments={};
vweb.payments._initialize_stripe=function(){
if (this.stripe===undefined){
if (this.publishable_key==null){
throw Error("Define the \"vweb.payments.publishable_key\" attribute with your stripe publishable key.");
}
this.stripe=Stripe(this.publishable_key);
}
}
vweb.payments._initialize_address_elements=function(appearance={}){
if (this._address_elements==null){
if (this.cart.items.length===0){
throw Error("The shopping cart does not contain any items.");
}
let price=0,currency;
this.cart.items.iterate((item)=>{
price+=parseInt(item.product.price*100)*item.quantity;
if (currency===undefined){
currency=item.product.currency;
} else if (currency!=item.product.currency){
throw Error("Products with different currencies can not be charged in a single request.");
}
})
this._address_elements=this.stripe.elements({
mode:"payment",
amount:price,
currency:currency,
appearance:appearance,
});
}
}
vweb.payments._initialize_payment_elements=function(appearance={}){
if (this._payment_elements==null){
if (this._client_secret==null){
throw Error("No payment intent was created using \"vweb.payments.charge()\" or the shopping cart has been edited after the initial charge.");
}
this._payment_elements=this.stripe.elements({
clientSecret:this._client_secret,
appearance:appearance,
});
}
}
vweb.payments._reset=function(){
this._client_secret=null;
this._address=null;
this._address_elements=null;
if (this._address_element!=null){
this._address_element.stripe_element.destroy();
}
this._address_element=null;
this._payment_elements=null;
if (this._payment_element!=null){
this._payment_element.stripe_element.destroy();
}
this._payment_element=null;
}
vweb.payments.get_currency_symbol=function(currency){
switch (currency.toLowerCase()){
case "aed":return "د.إ";
case "afn":return "Af";
case "all":return "L";
case "amd":return "֏";
case "ang":return "ƒ";
case "aoa":return "Kz";
case "ars":return "$";
case "aud":return "$";
case "awg":return "ƒ";
case "azn":return "₼";
case "bam":return "KM";
case "bbd":return "Bds$";
case "bdt":return "৳";
case "bgn":return "лв";
case "bhd":return ".د.ب";
case "bif":return "FBu";
case "bmd":return "BD$";
case "bnd":return "B$";
case "bob":return "Bs";
case "brl":return "R$";
case "bsd":return "B$";
case "btn":return "Nu.";
case "bwp":return "P";
case "byn":return "Br";
case "bzd":return "BZ$";
case "cad":return "$";
case "cdf":return "FC";
case "chf":return "Fr";
case "clf":return "UF";
case "clp":return "$";
case "cny":return "¥";
case "cop":return "$";
case "crc":return "₡";
case "cuc":return "CUC$";
case "cup":return "CUP$";
case "cve":return "$";
case "czk":return "Kč";
case "djf":return "Fdj";
case "dkk":return "kr";
case "dop":return "RD$";
case "dzd":return "دج";
case "egp":return "E£";
case "ern":return "Nfk";
case "etb":return "Br";
case "eur":return "€";
case "fjd":return "FJ$";
case "fkp":return "£";
case "fok":return "F$";
case "gbp":return "£";
case "gel":return "₾";
case "ghc":return "₵";
case "gip":return "£";
case "gmd":return "D";
case "gnf":return "FG";
case "gtq":return "Q";
case "gyd":return "GY$";
case "hkd":return "HK$";
case "hnl":return "L";
case "hrk":return "kn";
case "htg":return "G";
case "huf":return "Ft";
case "idr":return "Rp";
case "ils":return "₪";
case "inr":return "₹";
case "iqd":return "د.ع";
case "irr":return "﷼";
case "isk":return "kr";
case "jmd":return "J$";
case "jod":return "JD";
case "jpy":return "¥";
case "kes":return "Ksh";
case "kgs":return "с";
case "khr":return "៛";
case "kmf":return "CF";
case "kpw":return "₩";
case "krw":return "₩";
case "kwd":return "KD";
case "kyd":return "CI$";
case "kzt":return "₸";
case "lak":return "₭";
case "lbp":return "L£";
case "lkr":return "Rs";
case "lrd":return "L$";
case "lsl":return "L";
case "lyd":return "ل.د";
case "mad":return "د.م.";
case "mdl":return "L";
case "mnt":return "₮";
case "mop":return "MOP$";
case "mur":return "Rs";
case "mvr":return "Rf";
case "mwk":return "MK";
case "mxn":return "$";
case "myr":return "RM";
case "mzn":return "MTn";
case "nad":return "N$";
case "ngn":return "₦";
case "nio":return "C$";
case "nok":return "kr";
case "npr":return "रू";
case "nzd":return "$";
case "omr":return "ر.ع.";
case "pab":return "B/.";
case "pen":return "S/.";
case "pgk":return "K";
case "php":return "₱";
case "pkr":return "Rs";
case "pln":return "zł";
case "pyg":return "₲";
case "qar":return "ر.ق";
case "ron":return "lei";
case "rsd":return "din.";
case "rub":return "₽";
case "rwf":return "FRw";
case "sar":return "ر.س";
case "sbd":return "SI$";
case "scr":return "Sr";
case "sdg":return "ج.س.";
case "sek":return "kr";
case "sgd":return "S$";
case "shp":return "£";
case "sll":return "Le";
case "sos":return "S";
case "srd":return "SRD$";
case "ssp":return "£";
case "std":return "Db";
case "sek":return "kr";
case "syp":return "S£";
case "szl":return "L";
case "thb":return "฿";
case "tjs":return "ЅМ";
case "tmt":return "m";
case "tnd":return "د.ت";
case "top":return "T$";
case "try":return "₺";
case "ttd":return "TT$";
case "twd":return "NT$";
case "tzs":return "TSh";
case "uah":return "₴";
case "ugx":return "USh";
case "usd":return "$";
case "uyu":return "$U";
case "uzs":return "лв";
case "ves":return "Bs.S.";
case "vnd":return "₫";
case "vuv":return "VT";
case "wst":return "WS$";
case "xaf":return "FCFA";
case "xcd":return "EC$";
case "xof":return "CFA";
case "xpf":return "CFP";
case "yer":return "﷼";
case "zar":return "R";
case "zmw":return "ZK";
}
return null;
}
vweb.payments.get_products=async function(){
return new Promise((resolve,reject)=>{
if (this._products!==undefined){
return resolve(this._products);
}
vweb.utils.request({
method:"GET",
url:"/vweb/payments/products",
})
.then((products)=>{
this._products=products;
resolve(this._products);
})
.catch((err)=>{
reject(err);
})
})
}
vweb.payments.get_product=async function(id){
return new Promise(async (resolve,reject)=>{
const products=await this.get_products();
let product;
products.iterate((p)=>{
if (p.id===id){
product=p;
return true;
}
if (p.is_subscription){
return p.plans.iterate((plan)=>{
if (plan.id===id){
product=plan;
return true;
}
});
}
})
if (product==null){
return reject(`Product "${id}" does not exist.`);
}
resolve(product);
})
}
vweb.payments.get_payments=function({status="paid",days=30,refunded=null,limit=null}={}){
return vweb.utils.request({
method:"GET",
url:"/vweb/payments/payments",
data:{
status:status,
days:days,
refunded:refunded,
limit:limit,
},
});
}
vweb.payments.get_subscriptions=function(){
return vweb.utils.request({
method:"GET",
url:"/vweb/payments/subscriptions",
});
}
vweb.payments.is_subscribed=function(id){
return vweb.utils.request({
method:"POST",
url:"/vweb/payments/subscribed",
data:{
product:id,
}
});
}
vweb.payments.cancel_subscription=function(id){
return vweb.utils.request({
method:"DELETE",
url:"/vweb/payments/subscription",
data:{
product:id,
}
});
}
vweb.payments.get_refundable_payments=function({days=30,refunded=null,limit=null}={}){
return vweb.utils.request({
method:"GET",
url:"/vweb/payments/refundable",
data:{
days:days,
refunded:refunded,
limit:limit,
},
});
}
vweb.payments.create_refund=function({payment,auto_advance=true}){
return vweb.utils.request({
method:"POST",
url:"/vweb/payments/refund",
data:{
payment:payment,
auto_advance:auto_advance,
},
});
}
vweb.payments.create_address_element=function(mode="billing"){
if (this._address_element!=null){
return this._address_element;
}
this._initialize_stripe();
this._initialize_address_elements();
this._address_element=VStack();
this._address_element.stripe_element=this._address_elements.create("address",{
mode:mode,
});
this._address_element.stripe_element.mount(this._address_element);
return this._address_element;
}
vweb.payments.create_payment_element=function(){
if (this._payment_element!=null){
return this._payment_element;
}
this._initialize_stripe();
this._initialize_payment_elements();
this._payment_element=VStack();
this._payment_element.stripe_element=this._payment_elements.create("payment");
this._payment_element.stripe_element.mount(this._payment_element);
return this._payment_element;
}
vweb.payments.has_pending_charge=function(){
return this._client_secret!=null;
}
vweb.payments.charge=async function(){
return new Promise(async (resolve,reject)=>{
this._client_secret=null;
this._return_url=null;
this._payment_elements=null;
this._payment_element=null;
if (vweb.payments.cart.items.length===0){
return reject(new Error("No products were added to the shopping cart."));
}
if (this._address_elements==null){
return reject(new Error("No address element was created using \"vweb.payments.create_address_element()\"."));
}
const {error}=await this._address_elements.submit();
if (error){
return reject(error);
}
const address_info=await this._address_element.stripe_element.getValue();
this._address=address_info.value;
if (address_info.complete!==true){
return reject(new Error("Incomplete address information."));
}
try {
const result=await vweb.utils.request({
method:"POST",
url:"/vweb/payments/charge",
data:{
cart:vweb.payments.cart.items,
name:this._address.name,
phone:this._address.phone,
address:this._address.address,
}
})
this._client_secret=result.client_secret;
this._return_url=result.return_url;
resolve();
} catch (error){
return reject(error);
}
})
}
vweb.payments.confirm_charge=async function(){
return new Promise(async (resolve,reject)=>{
if (this._client_secret==null){
return reject(new Error("No payment intent was created using \"vweb.payments.charge()\" or the shopping cart has been edited after the initial charge."));
}
if (this._return_url==null){
return reject(new Error("No payment intent was created using \"vweb.payments.charge()\"."));
}
if (this._payment_element==null){
return reject(new Error("No payment element was created using \"vweb.payments.create_payment_element()\"."));
}
if (this._address==null){
return reject(new Error("No address element was defined using \"vweb.payments.create_payment_element()\"."));
}
this._initialize_stripe();
const {error}=await this._payment_elements.submit();
if (error){
return reject(error);
}
let result=await this.stripe.confirmPayment({
elements:this._payment_elements,
clientSecret:this._client_secret,
shipping:{
name:this._address.name,
phone:this._address.phone,
address:this._address.address,
},
redirect:"always",
confirmParams:{
return_url:this._return_url,
},
});
if (result.error){
return reject(result.error.message);
}
this.cart.clear();
resolve();
})
}
vweb.payments.charge_status=async function(client_secret){
return new Promise(async (resolve,reject)=>{
this._initialize_stripe();
const result=await this.stripe.retrievePaymentIntent(client_secret);
if (result.error){
return reject(response.error);
}
let message,charged=false,cancelled=false,processing=false;
switch (result.paymentIntent.status){
case "requires_payment_method":
message="The payment requires a payment method.";
break;
case "requires_confirmation":
message="The payment requires confirmation.";
break;
case "requires_action":
message="The payment requires action.";
break;
case "processing":
processing=true;
message="The payment is still processing.";
break;
case "requires_capture":
message="The payment requires capture.";
break;
case "canceled":
cancelled=true;
message="The payment has been cancelled.";
break;
case "succeeded":
charged=true;
message="The payment has succeeded.";
break;
}
resolve({
status:result.paymentIntent.status,
charged:charged,
cancelled:cancelled,
processing:processing,
message:message,
payment_intent:result.paymentIntent,
});
})
}
vweb.payments.cart={};
vweb.payments.cart.refresh=function(){
try {
this.items=JSON.parse(localStorage.getItem("vweb_shopping_cart"))||[];
} catch(err){
this.items=[];
}
vweb.payments._reset();
}
vweb.payments.cart.refresh();
vweb.payments.cart.save=function(cart){
localStorage.setItem("vweb_shopping_cart",JSON.stringify(this.items));
vweb.payments._reset();
}
vweb.payments.cart.add=async function(id,quantity=1){
this.refresh();
const found=this.items.iterate((item)=>{
if (item.product.id===id){
item.quantity+=quantity;
return true;
}
})
if (found!==true){
const product=await vweb.payments.get_product(id);
this.items.push({
product:product,
quantity:quantity,
});
}
this.save();
}
vweb.payments.cart.remove=async function(id,quantity=1){
this.refresh();
let new_cart=[];
this.items.iterate((item)=>{
if (item.product.id===id){
if (quantity==="all"){
item.quantity=0;
} else {
item.quantity-=quantity;
}
}
if (item.quantity>0){
new_cart.push(item);
}
})
this.items.length=0;
new_cart.iterate((item)=>{
this.items.push(item);
})
this.save();
}
vweb.payments.cart.clear=async function(id,quantity=1){
this.items=[];
this.save();
}
