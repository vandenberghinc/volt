/*
 * Author: VInc.
 * Copyright: © 2023 - 2024 VInc.
 * Version: v1.2.7
 */
vweb.payments={};
vweb.payments.client_key="{{ADYEN_CLIENT_KEY}}";
vweb.payments.environment="{{ADYEN_ENV}}";
vweb.payments.countries={
"AD":"🇦🇩  Andorra",
"AE":"🇦🇪  United Arab Emirates",
"AF":"🇦🇫  Afghanistan",
"AG":"🇦🇬  Antigua and Barbuda",
"AI":"🇦🇮  Anguilla",
"AL":"🇦🇱  Albania",
"AM":"🇦🇲  Armenia",
"AO":"🇦🇴  Angola",
"AQ":"🇦🇶  Antarctica",
"AR":"🇦🇷  Argentina",
"AS":"🇦🇸  American Samoa",
"AT":"🇦🇹  Austria",
"AU":"🇦🇺  Australia",
"AW":"🇦🇼  Aruba",
"AX":"🇦🇽  Åland Islands",
"AZ":"🇦🇿  Azerbaijan",
"BA":"🇧🇦  Bosnia and Herzegovina",
"BB":"🇧🇧  Barbados",
"BD":"🇧🇩  Bangladesh",
"BE":"🇧🇪  Belgium",
"BF":"🇧🇫  Burkina Faso",
"BG":"🇧🇬  Bulgaria",
"BH":"🇧🇭  Bahrain",
"BI":"🇧🇮  Burundi",
"BJ":"🇧🇯  Benin",
"BL":"🇧🇱  Saint Barthélemy",
"BM":"🇧🇲  Bermuda",
"BN":"🇧🇳  Brunei",
"BO":"🇧🇴  Bolivia",
"BQ":"🇧🇶  Caribbean Netherlands",
"BR":"🇧🇷  Brazil",
"BS":"🇧🇸  Bahamas",
"BT":"🇧🇹  Bhutan",
"BV":"🇧🇻  Bouvet Island",
"BW":"🇧🇼  Botswana",
"BY":"🇧🇾  Belarus",
"BZ":"🇧🇿  Belize",
"CA":"🇨🇦  Canada",
"CC":"🇨🇨  Cocos (Keeling) Islands",
"CD":"🇨🇩  Congo (DRC)",
"CF":"🇨🇫  Central African Republic",
"CG":"🇨🇬  Congo (Republic)",
"CH":"🇨🇭  Switzerland",
"CI":"🇨🇮  Côte d'Ivoire",
"CK":"🇨🇰  Cook Islands",
"CL":"🇨🇱  Chile",
"CM":"🇨🇲  Cameroon",
"CN":"🇨🇳  China",
"CO":"🇨🇴  Colombia",
"CR":"🇨🇷  Costa Rica",
"CU":"🇨🇺  Cuba",
"CV":"🇨🇻  Cape Verde",
"CW":"🇨🇼  Curaçao",
"CX":"🇨🇽  Christmas Island",
"CY":"🇨🇾  Cyprus",
"CZ":"🇨🇿  Czech Republic",
"DE":"🇩🇪  Germany",
"DJ":"🇩🇯  Djibouti",
"DK":"🇩🇰  Denmark",
"DM":"🇩🇲  Dominica",
"DO":"🇩🇴  Dominican Republic",
"DZ":"🇩🇿  Algeria",
"EC":"🇪🇨  Ecuador",
"EE":"🇪🇪  Estonia",
"EG":"🇪🇬  Egypt",
"EH":"🇪🇭  Western Sahara",
"ER":"🇪🇷  Eritrea",
"ES":"🇪🇸  Spain",
"ET":"🇪🇹  Ethiopia",
"FI":"🇫🇮  Finland",
"FJ":"🇫🇯  Fiji",
"FK":"🇫🇰  Falkland Islands (Malvinas)",
"FM":"🇫🇲  Micronesia",
"FO":"🇫🇴  Faroe Islands",
"FR":"🇫🇷  France",
"GA":"🇬🇦  Gabon",
"GB":"🇬🇧  United Kingdom",
"GD":"🇬🇩  Grenada",
"GE":"🇬🇪  Georgia",
"GF":"🇬🇫  French Guiana",
"GG":"🇬🇬  Guernsey",
"GH":"🇬🇭  Ghana",
"GI":"🇬🇮  Gibraltar",
"GL":"🇬🇱  Greenland",
"GM":"🇬🇲  Gambia",
"GN":"🇬🇳  Guinea",
"GP":"🇬🇵  Guadeloupe",
"GQ":"🇬🇶  Equatorial Guinea",
"GR":"🇬🇷  Greece",
"GS":"🇬🇸  South Georgia and the South Sandwich Islands",
"GT":"🇬🇹  Guatemala",
"GU":"🇬🇺  Guam",
"GW":"🇬🇼  Guinea-Bissau",
"GY":"🇬🇾  Guyana",
"HK":"🇭🇰  Hong Kong",
"HM":"🇭🇲  Heard Island and McDonald Islands",
"HN":"🇭🇳  Honduras",
"HR":"🇭🇷  Croatia",
"HT":"🇭🇹  Haiti",
"HU":"🇭🇺  Hungary",
"ID":"🇮🇩  Indonesia",
"IE":"🇮🇪  Ireland",
"IL":"🇮🇱  Israel",
"IM":"🇮🇲  Isle of Man",
"IN":"🇮🇳  India",
"IO":"🇮🇴  British Indian Ocean Territory",
"IQ":"🇮🇶  Iraq",
"IR":"🇮🇷  Iran",
"IS":"🇮🇸  Iceland",
"IT":"🇮🇹  Italy",
"JE":"🇯🇪  Jersey",
"JM":"🇯🇲  Jamaica",
"JO":"🇯🇴  Jordan",
"JP":"🇯🇵  Japan",
"KE":"🇰🇪  Kenya",
"KG":"🇰🇬  Kyrgyzstan",
"KH":"🇰🇭  Cambodia",
"KI":"🇰🇮  Kiribati",
"KM":"🇰🇲  Comoros",
"KN":"🇰🇳  Saint Kitts and Nevis",
"KP":"🇰🇵  North Korea",
"KR":"🇰🇷  South Korea",
"KW":"🇰🇼  Kuwait",
"KY":"🇰🇾  Cayman Islands",
"KZ":"🇰🇿  Kazakhstan",
"LA":"🇱🇦  Laos",
"LB":"🇱🇧  Lebanon",
"LC":"🇱🇨  Saint Lucia",
"LI":"🇱🇮  Liechtenstein",
"LK":"🇱🇰  Sri Lanka",
"LR":"🇱🇷  Liberia",
"LS":"🇱🇸  Lesotho",
"LT":"🇱🇹  Lithuania",
"LU":"🇱🇺  Luxembourg",
"LV":"🇱🇻  Latvia",
"LY":"🇱🇾  Libya",
"MA":"🇲🇦  Morocco",
"MC":"🇲🇨  Monaco",
"MD":"🇲🇩  Moldova",
"ME":"🇲🇪  Montenegro",
"MF":"🇲🇫  Saint Martin",
"MG":"🇲🇬  Madagascar",
"MH":"🇲🇭  Marshall Islands",
"MK":"🇲🇰  North Macedonia",
"ML":"🇲🇱  Mali",
"MM":"🇲🇲  Myanmar (Burma)",
"MN":"🇲🇳  Mongolia",
"MO":"🇲🇴  Macao",
"MP":"🇲🇵  Northern Mariana Islands",
"MQ":"🇲🇶  Martinique",
"MR":"🇲🇷  Mauritania",
"MS":"🇲🇸  Montserrat",
"MT":"🇲🇹  Malta",
"MU":"🇲🇺  Mauritius",
"MV":"🇲🇻  Maldives",
"MW":"🇲🇼  Malawi",
"MX":"🇲🇽  Mexico",
"MY":"🇲🇾  Malaysia",
"MZ":"🇲🇿  Mozambique",
"NA":"🇳🇦  Namibia",
"NC":"🇳🇨  New Caledonia",
"NE":"🇳🇪  Niger",
"NF":"🇳🇫  Norfolk Island",
"NG":"🇳🇬  Nigeria",
"NI":"🇳🇮  Nicaragua",
"NL":"🇳🇱  Netherlands",
"NO":"🇳🇴  Norway",
"NP":"🇳🇵  Nepal",
"NR":"🇳🇷  Nauru",
"NU":"🇳🇺  Niue",
"NZ":"🇳🇿  New Zealand",
"OM":"🇴🇲  Oman",
"PA":"🇵🇦  Panama",
"PE":"🇵🇪  Peru",
"PF":"🇵🇫  French Polynesia",
"PG":"🇵🇬  Papua New Guinea",
"PH":"🇵🇭  Philippines",
"PK":"🇵🇰  Pakistan",
"PL":"🇵🇱  Poland",
"PM":"🇵🇲  Saint Pierre and Miquelon",
"PN":"🇵🇳  Pitcairn Islands",
"PR":"🇵🇷  Puerto Rico",
"PS":"🇵🇸  Palestine",
"PT":"🇵🇹  Portugal",
"PW":"🇵🇼  Palau",
"PY":"🇵🇾  Paraguay",
"QA":"🇶🇦  Qatar",
"RE":"🇷🇪  Réunion",
"RO":"🇷🇴  Romania",
"RS":"🇷🇸  Serbia",
"RU":"🇷🇺  Russia",
"RW":"🇷🇼  Rwanda",
"SA":"🇸🇦  Saudi Arabia",
"SB":"🇸🇧  Solomon Islands",
"SC":"🇸🇨  Seychelles",
"SD":"🇸🇩  Sudan",
"SE":"🇸🇪  Sweden",
"SG":"🇸🇬  Singapore",
"SH":"🇸🇭  Saint Helena, Ascension and Tristan da Cunha",
"SI":"🇸🇮  Slovenia",
"SJ":"🇸🇯  Svalbard and Jan Mayen",
"SK":"🇸🇰  Slovakia",
"SL":"🇸🇱  Sierra Leone",
"SM":"🇸🇲  San Marino",
"SN":"🇸🇳  Senegal",
"SO":"🇸🇴  Somalia",
"SR":"🇸🇷  Suriname",
"SS":"🇸🇸  South Sudan",
"ST":"🇸🇹  São Tomé and Príncipe",
"SV":"🇸🇻  El Salvador",
"SX":"🇸🇽  Sint Maarten",
"SY":"🇸🇾  Syria",
"SZ":"🇸🇿  Eswatini",
"TC":"🇹🇨  Turks and Caicos Islands",
"TD":"🇹🇩  Chad",
"TF":"🇹🇫  French Southern and Antarctic Lands",
"TG":"🇹🇬  Togo",
"TH":"🇹🇭  Thailand",
"TJ":"🇹🇯  Tajikistan",
"TK":"🇹🇰  Tokelau",
"TL":"🇹🇱  Timor-Leste",
"TM":"🇹🇲  Turkmenistan",
"TN":"🇹🇳  Tunisia",
"TO":"🇹🇴  Tonga",
"TR":"🇹🇷  Turkey",
"TT":"🇹🇹  Trinidad and Tobago",
"TV":"🇹🇻  Tuvalu",
"TW":"🇹🇼  Taiwan",
"TZ":"🇹🇿  Tanzania",
"UA":"🇺🇦  Ukraine",
"UG":"🇺🇬  Uganda",
"UM":"🇺🇲  U.S. Minor Outlying Islands",
"US":"🇺🇸  United States",
"UY":"🇺🇾  Uruguay",
"UZ":"🇺🇿  Uzbekistan",
"VA":"🇻🇦  Vatican City",
"VC":"🇻🇨  Saint Vincent and the Grenadines",
"VE":"🇻🇪  Venezuela",
"VG":"🇻🇬  British Virgin Islands",
"VI":"🇻🇮  U.S. Virgin Islands",
"VN":"🇻🇳  Vietnam",
"VU":"🇻🇺  Vanuatu",
"WF":"🇼🇫  Wallis and Futuna",
"WS":"🇼🇸  Samoa",
"YE":"🇾🇪  Yemen",
"YT":"🇾🇹  Mayotte",
"ZA":"🇿🇦  South Africa",
"ZM":"🇿🇲  Zambia",
"ZW":"🇿🇼  Zimbabwe",
};
vweb.payments.include_started=true;
vweb.payments.include_finished=false;
vweb.payments._reset=function(){
if (this._payment_element!==undefined){
this._payment_element.remove();
}
this._payment_element=undefined;
}
vweb.payments._set_step=async function(){
switch (this._step){
case 0:{
this._steps_element.select(this._step);
this._order_container.show();
this._billing_container.hide();
this._payment_container.hide();
this._processing_container.hide();
this._checkout_button.text.text("Next");
this._policy_checkbox.hide();
this._prev_step_button.hide();
break;
}
case 1:{
if (this.cart.items.length===0){
--this._step;
console.error(new Error("Shopping cart is empty."));
this.on_error(new Error("Shopping cart is empty."));
return null;
}
await this._render_billing_element()
this._steps_element.select(this._step);
this._order_container.hide();
this._billing_container.show();
this._payment_container.hide();
this._processing_container.hide();
this._checkout_button.text.text("Next");
this._policy_checkbox.hide();
this._prev_step_button.show();
break;
}
case 2:{
try {
this._billing_details=this._billing_element.data()
this._billing_details.phone_number=this._billing_details.phone_country_code+this._billing_details.phone_number;
delete this._billing_details.phone_country_code;
}catch (error){
--this._step;
console.error(error);
this.on_error(error);
return null;
}
try {
await this._render_payment_element()
}catch (error){
--this._step;
console.error(error);
this.on_error(error);
return null;
}
this._steps_element.select(this._step);
this._order_container.hide();
this._billing_container.hide();
this._payment_container.show();
this._processing_container.hide();
this._checkout_button.text.text("Checkout");
this._policy_checkbox.show();
this._prev_step_button.show();
break;
}
case 3:{
try {
this._policy_checkbox.submit();
}catch (error){
console.error(error);
this.on_error(error);
return null;
}
this._steps_element.select(this._step);
this.dropin_component.submit();
this._order_container.hide();
this._billing_container.hide();
this._overview_container.hide();
this._prev_step_button.hide();
break;
}
}
}
vweb.payments._next=async function(){
if (this._step<3){
++this._step;
await this._set_step();
}else if (this._step===3){
await this._set_step();
}
}
vweb.payments._prev=async function(){
if (this._step>0){
--this._step;
await this._set_step();
}
}
vweb.payments._render_steps_element=function(){
const style=this._style;
this._prev_step_button=HStack(
ImageMask("/vweb_static/payments/arrow.long.png")
.frame(15,15)
.mask_color(this._style.subtext_fg)
.transform("rotate(180deg)")
.margin_right(10),
Text("Previous Step")
.color(this._style.subtext_fg)
.padding(0)
.margin(0)
.font_size(14)
)
.hide()
.on_click(()=>vweb.payments._prev())
.center_vertical();
this._steps_element=HStack(
ForEach(["Order Details","Billing Details","Payment Details","Processing Details"],(item,index)=>{
const stack=HStack(
VStack((index+1).toString())
.font_size(11)
.padding(0)
.margin(0)
.color(index===0?this._style.selected_fg:this._style.widget_fg)
.frame(17.5,17.5)
.background(index===0?this._style.selected_bg:this._style.widget_bg)
.border_radius("50%")
.margin_right(15)
.flex_shrink(0)
.center()
.center_vertical(),
Text(item)
.color(this._style.fg)
.padding(0)
.font_size(14)
.line_height(16)
)
.center_vertical()
.margin_right(25)
return stack;
}),
Spacer().min_frame(10,1),
this._prev_step_button,
)
.extend({
selected_index:0,
select:function(index){
let e=this.child(this.selected_index).child(0);
e.color(style.widget_fg);
e.background(style.widget_bg);
this.selected_index=index;
e=this.child(this.selected_index).child(0);
e.color(style.selected_fg);
e.background(style.selected_bg);
}
})
this._steps_container.append(this._steps_element);
}
vweb.payments._render_overview_element=function(){
this._overview_subtotal=Text("$ 0.00")
.color(this._style.fg)
.font_size(this._style.font_size)
.flex_shrink(0)
.margin(0)
.padding(0)
this._overview_total=Text("$ 0.00")
.font_weight("bold")
.color(this._style.fg)
.font_size(this._style.font_size)
.flex_shrink(0)
.margin(0)
.padding(0)
this._checkout_button=LoaderButton("Next")
.border_radius(10)
.color(this._style.button_fg)
.background(this._style.button_bg)
.hover_brightness(...this._style.button_brightness)
.loader
.background(this._style.button_fg)
.update()
.parent()
.on_click(async ()=>{
this._checkout_button.show_loader();
vweb.payments._next()
.then(()=>{
this._checkout_button.hide_loader();
})
.catch(()=>{
this._checkout_button.hide_loader();
})
});
this._policy_checkbox=CheckBox({text:"I agree to the Terms and Conditions and the "+Link("Refund", this._refund_policy)+" and "+Link("Cancellation", this._cancellation_policy)+" policy. I agree that my payment method may be used for recurring subscriptions.",required:true})
.color(this._style.subtext_fg)
.border_color(this._style.border_bg)
.font_size(this._style.font_size-6)
.focus_color(this._style.theme_fg)
.missing_color(this._style.missing_fg)
.inner_bg(this._style.bg)
.margin_bottom(15)
.hide();
this._overview_element=VStack(
Title("Overview")
.color(this._style.title_fg)
.font_size(this._style.font_size-2)
.flex_shrink(0)
.margin(0,0,15,0)
.letter_spacing("1px")
.text_transform("uppercase")
.ellipsis_overflow(true),
HStack(
Text("Subtotal:")
.color(this._style.fg)
.font_size(this._style.font_size)
.stretch(true)
.flex_shrink(0)
.margin(0,5,0,0)
.padding(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
this._overview_subtotal,
),
HStack(
Text("Shipping:")
.color(this._style.fg)
.font_size(this._style.font_size)
.stretch(true)
.flex_shrink(0)
.margin(0,5,0,0)
.padding(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
Text("free")
.color(this._style.fg)
.font_size(this._style.font_size)
.flex_shrink(0)
.margin(0)
.padding(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
)
.margin_top(5),
Divider()
.margin(20,0,20,0)
.background(this._style.border_bg),
HStack(
Text("Total:")
.font_weight("bold")
.color(this._style.fg)
.font_size(this._style.font_size)
.stretch(true)
.flex_shrink(0)
.margin(0,5,0,0)
.padding(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
this._overview_total,
)
.margin_bottom(25),
this._policy_checkbox,
this._checkout_button,
)
this._overview_container.append(this._overview_element);
}
vweb.payments._render_order_element=function(){
this._order_element=VStack()
.extend({
refresh:function(){
vweb.payments.cart.refresh();
const style=vweb.payments._style;
const cart=vweb.payments.cart;
const cart_items=vweb.payments.cart.items;
let subtotal=0,currency_symbol;
cart_items.iterate((item)=>{
if (currency_symbol===undefined){
currency_symbol=vweb.payments.get_currency_symbol(item.product.currency);
}
subtotal+=item.product.price*item.quantity;
});
vweb.payments._overview_subtotal.text(`${currency_symbol} ${subtotal.toFixed(2)}`)
vweb.payments._overview_total.text(`${currency_symbol} ${subtotal.toFixed(2)}`)
this.remove_children();
if (cart_items.length===0){
this.height(160)
this.append(
VStack(
ImageMask("/vweb_static/payments/shopping_cart.png")
.frame(35,35)
.margin_bottom(15)
.mask_color(style.theme_fg),
Text("Shopping cart is empty.")
.color(style.fg)
)
.frame("100%","100%")
.center()
.center_vertical()
);
}else {
this.append(
Title("Order Details")
.color(style.title_fg)
.font_size(style.font_size-2)
.flex_shrink(0)
.margin(0,0,0,0)
.letter_spacing("1px")
.text_transform("uppercase")
.ellipsis_overflow(true),
Divider()
.background(style.border_bg)
.margin(10,0,20,0),
ForEach(cart_items,(item,index)=>{
const quantity_input=Input("Quantity")
.value(item.quantity)
.font_size(16)
.color(style.input_fg)
.border(1,style.border_bg)
.padding(12.5,10,12.5,10)
.margin_right(10)
.flex_shrink(0)
.max_width(50)
.on_input((_,event)=>{
clearTimeout(quantity_input.timeout);
quantity_input.timeout=setTimeout(()=>{
const value=quantity_input.value();
const quantity=parseInt(value);
if (isNaN(quantity)){
console.error(`Specified quantity "${value}" is not a number.`);
vweb.payments.on_error(new Error(`Specified quantity "${value}" is not a number.`));
quantity_input.value(item.quantity.toString());
return null;
}
item.quantity=quantity;
cart.save();
this.refresh();
},500)
})
const stack=HStack(
item.product.icon==null?null :
Image(item.product.icon)
.frame(30,30)
.flex_shrink(0)
.margin(0,25,0,0),
VStack(
Title(item.product.name)
.color(style.fg)
.font_size(style.font_size)
.margin(0,10,0,0)
.padding(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
Text(item.product.description)
.color(style.subtext_fg)
.font_size(style.font_size-2)
.line_height(style.font_size)
.margin(10,10,0,0)
.wrap(true)
.padding(0),
HStack(
Text("Quantity")
.color(style.fg)
.font_size(style.font_size)
.margin(0,10,2,0)
.padding(0)
.flex_shrink(0),
quantity_input,
ImageMask("/vweb_static/payments/minus.png")
.frame(20,20)
.padding(5)
.margin_right(5)
.mask_color(style.widget_fg)
.background(style.widget_bg)
.border_radius("50%")
.flex_shrink(0)
.hover_brightness(...style.button_brightness)
.on_click(async ()=>{
if (item.quantity===1){
await cart.remove(item.product.id,"all")
this.refresh()
}else {
await cart.remove(item.product.id,1)
this.refresh()
}
}),
ImageMask("/vweb_static/payments/plus.png")
.frame(20,20)
.padding(5)
.margin_right(5)
.mask_color(style.widget_fg)
.background(style.widget_bg)
.border_radius("50%")
.flex_shrink(0)
.hover_brightness(...style.button_brightness)
.on_click(async ()=>{
await cart.add(item.product.id,1)
this.refresh()
}),
ImageMask("/vweb_static/payments/trash.png")
.frame(20,20)
.padding(5)
.margin_right(5)
.mask_color(style.widget_fg)
.background(style.widget_bg)
.border_radius("50%")
.flex_shrink(0)
.hover_brightness(...style.button_brightness)
.on_click(async ()=>{
await cart.remove(item.product.id,"all")
this.refresh()
}),
)
.center_vertical()
.wrap(true)
.margin_top(20)
)
.stretch(true),
VStack(
Title(`${currency_symbol} ${(item.product.price*item.quantity).toFixed(2)}`)
.color(style.fg)
.font_size(style.font_size)
.margin(0)
.padding(0)
.flex_shrink(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
Text(`${currency_symbol} ${item.product.price} per item`)
.color(style.subtext_fg)
.font_size(style.font_size-4)
.margin(5,0,0,0)
.padding(0)
.flex_shrink(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
)
)
.width("100%");
return [
stack,
index===cart_items.length-1?null :Divider()
.margin(20,0,20,0)
];
})
)
}
return this;
}
})
this._order_container.append(this._order_element.refresh());
}
vweb.payments._render_billing_element=async function(){
if (this._billing_element!==undefined){return ;}
const CreateInput=(args)=>{
return ExtendedInput(args)
.color(this._style.fg)
.font_size(this._style.font_size)
.missing_color(this._style.missing_fg)
.focus_color(this._style.theme_fg)
.border_color(this._style.border_bg)
.border_radius(this._style.border_radius)
.input
.color(this._style.input_fg)
.parent();
}
const CreateSelect=(args)=>{
return ExtendedSelect(args)
.color(this._style.fg)
.font_size(this._style.font_size)
.missing_color(this._style.missing_fg)
.focus_color(this._style.theme_fg)
.border_color(this._style.border_bg)
.border_radius(this._style.border_radius)
.input
.white_space("pre")
.color(this._style.input_fg)
.parent();
}
this._billing_element=Form(
Title("Billing Details")
.color(this._style.title_fg)
.font_size(this._style.font_size-2)
.flex_shrink(0)
.margin(0,0,0,0)
.letter_spacing("1px")
.text_transform("uppercase")
.ellipsis_overflow(true),
Divider()
.background(this._style.border_bg)
.margin(10,0,10,0),
CreateInput({
label:"First Name",
placeholder:"John",
})
.value(vweb.user.first_name()||"")
.required(true)
.id("first_name"),
CreateInput({
label:"Last Name",
placeholder:"Doe",
})
.value(vweb.user.last_name()||"")
.margin_top(10)
.required(true)
.id("last_name"),
CreateInput({
label:"Email",
placeholder:"my@email.com",
})
.value(vweb.user.email()||"")
.margin_top(10)
.required(true)
.id("email"),
CreateInput({
label:"Street",
placeholder:"123 Park Avenue",
})
.value("Ensahlaan")
.margin_top(10)
.required(true)
.id("street"),
CreateInput({
label:"House Number",
placeholder:"Suite 405",
})
.value("25")
.margin_top(10)
.required(true)
.id("house_number"),
CreateInput({
label:"Postal Code",
placeholder:"10001",
})
.value("3723HT")
.margin_top(10)
.required(true)
.id("postal_code"),
CreateInput({
label:"City",
placeholder:"New York",
})
.value("Bilthoven")
.margin_top(10)
.required(true)
.id("city"),
CreateInput({
label:"Province",
placeholder:"New York",
})
.value("Utrecht")
.margin_top(10)
.required(true)
.id("province"),
CreateSelect({
label:"Country",
placeholder:"United States",
items:vweb.payments.countries,
})
.value("NL")
.margin_top(10)
.required(true)
.id("country"),
HStack(
CreateInput({
label:"Country Code",
placeholder:"+1",
type:"tel",
})
.value("+31")
.max_width("fit-content")
.margin_top(10)
.margin_right(10)
.required(true)
.id("phone_country_code"),
CreateInput({
label:"Phone Number",
placeholder:"123-456-7890",
type:"tel",
})
.value("681471789")
.margin_top(10)
.stretch(true)
.required(true)
.id("phone_number"),
)
.width("100%")
)
this._billing_container.append(this._billing_element);
}
vweb.payments._render_payment_element=async function(){
if (this.include_started!==true){
throw Error("The payments module is not included, make sure you enable the \"payments\" flag on the JavaScript view.");
}else if (this.include_finished!==true){
await new Promise((resolve,reject)=>{
const wait=async (elapsed=0)=>{
if (this.include_finished===true){
resolve();
}else if (elapsed>=10000){
reject(new Error("Failed to include the external payments module."));
}else {
setTimeout(()=>wait(elapsed+250),250);
}
}
})
}
if (this._payment_element!==undefined){
return ;
}
if (this.client_key==null){
throw Error(`No client key has been assigned to "vweb.payments.client_key".`);
}
if (this.cart.items.length===0){
throw new Error("Shopping cart is empty.");
}
let is_subscription=false;
this.cart.items.iterate((item)=>{
if (item.is_subscription===true){
subscription=true;
return false;
}
})
this._session=await vweb.utils.request({
method:"POST",
url:"/vweb/payments/session",
data:{
billing_details:this._billing_details,
cart:this.cart.items,
},
});
this._checkout=await AdyenCheckout({
session:{
id:this._session.id,
sessionData:this._session.sessionData,
},
clientKey:this.client_key,
environment:this.environment,
analytics:{
enabled:true 
},
showPayButton:false,
recurringProcessingModel:is_subscription,
storePaymentMethodMode:is_subscription?"enabled":undefined,
paymentMethodsConfiguration:{
card:{
hasHolderName:true,
holderNameRequired:true,
billingAddressRequired:true,
enableStoreDetails:is_subscription,
},
threeDS2:{
challengeWindowSize:'04',
},
},
onPaymentCompleted:async (result,component)=>{
switch (result.resultCode){
case "Authorised":
case "Error":
case "Cancelled":
case "Refused":
this._show_processing(result.resultCode);
break;
default:
console.log(`Payment result "${result.resultCode}".`)
break;
}
},
onError:(error,component)=>{
this.on_error(error);
console.error(error.name,error.message,error.stack,component);
},
});
this._dropin_container=VStack()
.width("100%")
.center()
this._payment_element=VStack(
Title("Payment Details")
.color(this._style.title_fg)
.font_size(this._style.font_size-2)
.flex_shrink(0)
.margin(0,0,0,0)
.letter_spacing("1px")
.text_transform("uppercase")
.ellipsis_overflow(true),
Divider()
.background(this._style.border_bg)
.margin(10,0,10,0),
this._dropin_container,
)
this.dropin_component=this._checkout.create("dropin").mount(this._dropin_container);
this._payment_container.append(this._payment_element);
}
vweb.payments._render_processing_element=function(){
if (this._processing_element!==undefined){
this._processing_element.set_processing();
return ;
}
this._processing_element=VStack(
Title("Processing")
.color(this._style.fg)
.font_size(this._style.font_size-2)
.flex_shrink(0)
.letter_spacing("1px")
.text_transform("uppercase")
.ellipsis_overflow(true)
.margin(0)
.padding(0)
.assign_to_parent_as("title_e"),
Text("Processing your payment, please wait.")
.color(this._style.subtext_fg)
.font_size(this._style.font_size-2)
.line_height(this._style.font_size)
.margin(10,0,0,0)
.padding(0)
.assign_to_parent_as("text_e")
.white_space("pre")
.line_height("1.4em")
.center(),
ImageMask("/vweb_static/payments/error.png")
.hide()
.frame(40,40)
.padding(5)
.mask_color(this._style.missing_fg)
.margin_top(15)
.assign_to_parent_as("error_image_e"),
Image("/vweb_static/payments/party.png")
.hide()
.frame(40,40)
.margin_top(15)
.assign_to_parent_as("success_image_e"),
RingLoader()
.background(this._style.theme_fg)
.frame(40,40)
.update()
.margin_top(15)
.assign_to_parent_as("loader_e"),
)
.padding(15,0)
.center()
.center_vertical()
.extend({
timestamp:Date.now(),
set_error:function (message="The payment has failed, please check your information and try again.\n If the problem persists, contact support for assistance."){
if (Date.now()-this.timestamp<500){
return setTimeout(()=>{
this.set_error(message);
},Date.now()-this.timestamp+1)
}
this.loader_e.hide();
this.error_image_e.src("/vweb_static/payments/error.png");
this.error_image_e.show();
this.success_image_e.hide();
this.title_e.text("Error")
this.text_e.text(message);
},
set_cancelled:function (message="The payment has been cancelled."){
if (Date.now()-this.timestamp<500){
return setTimeout(()=>{
this.set_cancelled(message);
},Date.now()-this.timestamp+1)
}
this.loader_e.hide();
this.error_image_e.src("/vweb_static/payments/cancelled.png");
this.error_image_e.show();
this.success_image_e.hide();
this.title_e.text("Cancelled")
this.text_e.text(message);
},
set_success:function (message="The payment has succeeded and is currently processing.\n Thank you for purchase!"){
if (Date.now()-this.timestamp<500){
return setTimeout(()=>{
this.set_success(message);
},Date.now()-this.timestamp+1)
}
this.loader_e.hide();
this.error_image_e.hide();
this.success_image_e.show();
this.title_e.text("Success")
this.text_e.text(message);
},
set_processing:function (message="Processing your payment, please wait."){
this.loader_e.show();
this.error_image_e.hide();
this.success_image_e.hide();
this.title_e.text("Processing")
this.text_e.text(message);
},
})
this._processing_container.append(this._processing_element);
}
vweb.payments._show_processing=async function(status=null){
this._step=3;
this._steps_element.select(this._step);
this._render_processing_element();
this._order_container.hide();
this._billing_container.hide();
this._payment_container.hide();
this._processing_container.show();
this._overview_container.hide();
this._prev_step_button.hide();
if (status!=null){
this._update_processing(status)
}
}
vweb.payments._update_processing=async function(status){
switch (status){
case "Authorised":
this._processing_element.set_success();
break;
case "ChallengeShopper":
case "IdentifyShopper":
case "PartiallyAuthorised":
case "Pending":
case "PresentToShopper":
case "Received":
case "RedirectShopper":
case "AuthenticationFinished":
case "AuthenticationNotRequired":
this._processing_element.set_processing();
break;
case "Cancelled":
this._processing_element.set_cancelled();
break;
case "Error":
case "Refused":
this._processing_element.set_error();
break;
default:
console.error(`Unknown session result code "${session.resultCode}".`);
this._processing_element.set_error("An unknown error has occurred.");
break;
}
}
vweb.payments._handle_redirect=async function(details){
this._show_processing();
let session;
try {
session=await vweb.utils.request({
method:"GET",
url:"/vweb/payments/session",
data:{
details:details,
},
});
}catch (error){
console.error(error);
this._processing_element.set_error("An unknown error has occurred.");
return ;
}
this._update_processing(session.resultCode);
}
vweb.payments.initialize=function({
steps_container=null,
order_container=null,
billing_container=null,
payment_container=null,
processing_container=null,
overview_container=null,
refund_policy=null,
cancellation_policy=null,
on_error=(error)=>{},
font_size=16,
fg="black",
title_fg="#687282",
bg="#FFFFFF",
subtext_fg="#6D6E77",
theme_fg="#8EB8EB",
widget_fg=null,
widget_bg="#00000015",
selected_fg=null,
selected_bg=null,
input_fg="black",
missing_fg="#E8454E",
button_fg="white",
button_bg="blue",
button_border_radius=30,
button_brightness=[1.1,1.2],
border_bg="gray",
border_radius=10,
}={}){
if (steps_container instanceof Node===false){
throw Error("The \"steps_container\" must be assigned with a container node.");
}
if (order_container instanceof Node===false){
throw Error("The \"order_container\" must be assigned with a container node.");
}
if (billing_container instanceof Node===false){
throw Error("The \"billing_container\" must be assigned with a container node.");
}
if (payment_container instanceof Node===false){
throw Error("The \"payment_container\" must be assigned with a container node.");
}
if (processing_container instanceof Node===false){
throw Error("The \"processing_container\" must be assigned with a container node.");
}
if (overview_container instanceof Node===false){
throw Error("The \"overview_container\" must be assigned with a container node.");
}
if (typeof refund_policy!=="string"){
throw Error("The \"refund_policy\" must be assigned with the endpoint of the refund policy.");
}
if (typeof cancellation_policy!=="string"){
throw Error("The \"cancellation_policy\" must be assigned with the endpoint of the cancellation policy.");
}
this._steps_container=steps_container;
this._order_container=order_container;
this._billing_container=billing_container.hide();
this._payment_container=payment_container.hide();
this._processing_container=processing_container.hide();
this._overview_container=overview_container;
this._refund_policy=refund_policy;
this._cancellation_policy=cancellation_policy;
this.on_error=on_error;
if (widget_fg==null){
widget_fg=fg;
}
if (selected_fg==null){
selected_fg=fg;
}
if (selected_fg==null){
selected_fg=fg;
}
if (selected_bg==null){
selected_bg=theme_fg;
}
this._style={};
this._style.fg=fg;
this._style.title_fg=title_fg;
this._style.bg=bg;
this._style.subtext_fg=subtext_fg;
this._style.theme_fg=theme_fg;
this._style.selected_fg=selected_fg;
this._style.selected_bg=selected_bg;
this._style.widget_fg=widget_fg;
this._style.widget_bg=widget_bg;
this._style.input_fg=input_fg;
this._style.font_size=font_size;
this._style.missing_fg=missing_fg;
this._style.border_bg=border_bg;
this._style.border_radius=border_radius;
this._style.button_fg=button_fg;
this._style.button_bg=button_bg;
this._style.button_border_radius=button_border_radius;
this._style.button_brightness=button_brightness;
Object.keys(this._style).iterate((key)=>{
if (typeof this._style[key]==="number"){
document.documentElement.style.setProperty(`--vpayments_${key}`, this._style[key]+"px");
}else {
document.documentElement.style.setProperty(`--vpayments_${key}`, this._style[key]);
}
});
document.documentElement.style.setProperty(`--vpayments_theme_fg_80`, this._style.theme_fg+"80");
document.documentElement.style.setProperty(`--vpayments_missing_fg_80`, this._style.missing_fg+"80");
this._step=0;
this._render_steps_element();
if (vweb.utils.url_param("sessionId", null)!=null){
this._handle_redirect({
redirectResult:vweb.utils.url_param("redirectResult", undefined),
threeDSResult:vweb.utils.url_param("threeDSResult", undefined),
});
}
else {
this._render_overview_element();
this._render_order_element();
}
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
return reject(new Error(`Product "${id}" does not exist.`));
}
resolve(product);
})
}
vweb.payments.get_payment=async function(id){
return vweb.utils.request({
method:"GET",
url:"/vweb/payments/payment",
data:{
id:id,
}
})
}
vweb.payments.get_payments=async function({
days=30,
limit=null,
status=null,
}){
return vweb.utils.request({
method:"GET",
url:"/vweb/payments/payments",
data:{
days,
limit,
status,
}
})
}
vweb.payments.get_refundable_payments=async function({
days=30,
limit=null,
}){
return vweb.utils.request({
method:"GET",
url:"/vweb/payments/payments/refundable",
data:{
days,
limit,
}
})
}
vweb.payments.get_refunded_payments=async function({
days=30,
limit=null,
}){
return vweb.utils.request({
method:"GET",
url:"/vweb/payments/payments/refunded",
data:{
days,
limit,
}
})
}
vweb.payments.get_refunding_payments=async function({
days=null,
limit=null,
}){
return vweb.utils.request({
method:"GET",
url:"/vweb/payments/payments/refunding",
data:{
days,
limit,
}
})
}
vweb.payments.create_refund=async function(payment,line_items=null){
return vweb.utils.request({
method:"GET",
url:"/vweb/payments/refund",
data:{
payment,
line_items,
}
})
}
vweb.payments.cancel_subscription=async function(payment){
return vweb.utils.request({
method:"DELETE",
url:"/vweb/payments/subscription",
data:{
payment,
}
})
}
vweb.payments.cart={};
vweb.payments.cart.refresh=function(){
try {
this.items=JSON.parse(localStorage.getItem("vweb_shopping_cart"))||[];
}catch(err){
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
}else {
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
