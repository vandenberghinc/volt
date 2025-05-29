vweb.payments={};
vweb.payments.set_style=function({
color="black",
input_color="black",
font_size=16,
focus_color="#8EB8EB",
missing_color="#E8454E",
border_color="gray",
border_radius=5,
}={}){
this._style={};
this._style.color=color;
this._style.input_color=input_color;
this._style.font_size=font_size;
this._style.focus_color=focus_color;
this._style.missing_color=missing_color;
this._style.border_color=border_color;
this._style.border_radius=border_radius;
}
vweb.payments.set_style();
vweb.payments._initialize=function(){
if (this._initialized!==true){
if (this.public_key==null){
throw Error("Define the \"vweb.payments.publishable_key\" attribute with your checkout.com public key.");
}
Frames.init({
publicKey:this.public_key,
acceptedPaymentMethods:['Visa','Maestro','Mastercard','American Express','Diners Club','Discover','JCB','Mada','ideal'],
style:{
base:{
color:this._style.color,
fontSize:this._style.font_size+'px',
},
autofill:{
backgroundColor:'yellow',
},
hover:{
color:this._style.focus_color,
},
focus:{
color:this._style.focus_color,
},
valid:{
color:'green',
},
invalid:{
color:this._style.missing_color,
},
placeholder:{
base:{
color:'gray',
},
focus:{
border:`solid 1px ${this._style.focus_color}`,
},
},
},
cardTokenized:(data)=>{
this._token=data.token;
},
});
this._initialized=true;
}
}
vweb.payments.create_payment_element=function(){
if (this._payment_element===undefined){
this._payment_element=VStack().class("card-frame")
.on_render(()=>{
vweb.payments._initialize();
})
}
return this._payment_element;
}
vweb.payments.create_address_element=function(){
if (this._address_element===undefined){
const CreateInput=(args)=>{
return LabeledInput(args)
.color(this._style.color)
.font_size(this._style.font_size)
.missing_color(this._style.missing_color)
.focus_color(this._style.focus_color)
.input
.color(this._style.input_color)
.border_color(this._style.border_color)
.border_radius(this._style.border_radius)
.parent();
}
this._address_element=VStack(
CreateInput({
label:"Name",
placeholder:"Name",
})
.assign_to_parent_as("name"),
CreateInput({
label:"Street",
placeholder:"Street",
})
.margin_top(10)
.assign_to_parent_as("street"),
CreateInput({
label:"Street Number",
placeholder:"Street Number",
})
.margin_top(10)
.assign_to_parent_as("street_number"),
CreateInput({
label:"Zip Code",
placeholder:"Zip",
})
.margin_top(10)
.assign_to_parent_as("zip"),
CreateInput({
label:"City",
placeholder:"City",
})
.margin_top(10)
.assign_to_parent_as("city"),
CreateInput({
label:"State / Province",
placeholder:"State",
})
.margin_top(10)
.assign_to_parent_as("state"),
CreateInput({
label:"Country",
placeholder:"Country",
})
.margin_top(10)
.assign_to_parent_as("country"),
CreateInput({
label:"Phone Number",
placeholder:"Phone number",
type:PhoneNumberInput,
})
.margin_top(10)
.assign_to_parent_as("phone"),
)
.extend({
submit:function(){
error=[
this.name,
this.street,
this.street_number,
this.zip,
this.city,
this.state,
this.country,
this.phone,
].iterate((input)=>{
input.missing(false);
const value=input.value();
if (value==null||value.length===0){
input.missing(true);
throw new Error("Fill in all the required fields.");
}
})
return {
name:this
}
}
})
}
return this._address_element;
}
vweb.payments.charge=async function(){
return new Promise(async (resolve,reject)=>{
if (this._payment_element===undefined){
return reject(new Error("No payment element was created using \"vweb.payments.create_payment_element()\"."))
}
if (this._address_element===undefined){
return reject(new Error("No payment element was created using \"vweb.payments.create_payment_element()\"."))
}
try {
Frames.cardholder=this._address_element.submit()
} catch (error){
return reject(error);
}
let data;
try {
data=await Frames.submitCard()
} catch (error){
return reject(error);
}
return resolve();
});
}
