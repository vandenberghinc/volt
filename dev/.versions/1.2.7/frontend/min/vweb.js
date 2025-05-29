/*
 * Author: VInc.
 * Copyright: © 2023 - 2024 VInc.
 * Version: v1.2.7
 */
const vweb={};
vweb.internal={};
vweb.production="{{PRODUCTION}}"==="true";
vweb.utils={};
vweb.utils.is_string=function(value){
return typeof value==='string'||value instanceof String;
}
vweb.utils.is_numeric=function(value){
return typeof value==='number'&&Number.isFinite(value);
}
vweb.utils.is_int=function(value){
return typeof value==='number'&&Number.isInteger(value);
}
vweb.utils.is_float=function(value){
return typeof value==='number'&&!Number.isNaN(value)&&!Number.isInteger(value);
}
vweb.utils.is_func=function(value){
return typeof value==='function';
}
vweb.utils.is_array=function(value){
return Array.isArray(value);
}
vweb.utils.is_obj=function(value){
return value!=null&&typeof value==='object'&&Array.isArray(value)==false;
}
vweb.utils.is_even=function(number){
return number%2===0;
}
vweb.utils.is_mobile=function(){
return (
navigator.userAgent.match(/Android/i)||
navigator.userAgent.match(/webOS/i)||
navigator.userAgent.match(/iPhone/i)||
navigator.userAgent.match(/iPad/i)||
navigator.userAgent.match(/iPod/i)||
navigator.userAgent.match(/BlackBerry/i)||
navigator.userAgent.match(/Windows Phone/i)
);
}
vweb.utils.make_immutable=(object)=>{
if (Array.isArray(object)){
Object.freeze(object);
for (let i=0;i<object.length;i++){
if (object[i]!==null&&typeof object[i]==="object"){
object[i]=vweb.utils.make_immutable(object[i])
}
}
}
else if (object!==null&&typeof object==="object"){
Object.freeze(object);
Object.keys(object).iterate((key)=>{
if (object[key]!==null&&typeof object[key]==="object"){
object[key]=vweb.utils.make_immutable(object[key])
}
})
}
}
vweb.utils.is_child=(parent,target)=>{
for (let i=0;i<parent.children.length;i++){
if (target===parent.children[i]){
return true;
}
}
return false;
}
vweb.utils.is_nested_child=(parent,target,stop_node=null)=>{
let e=target;
while (e!=null){
if (e===parent){
return true;
}
else if (e===stop_node){
return false;
}
e=e.parentElement;
}
return false;
}
vweb.utils.round=function(value,decimals){
const factor=10**decimals;
return Math.round(value*factor)/factor;
}
vweb.utils.device_width=function(){
return (window.innerWidth>0)?window.innerWidth:screen.width;
}
vweb.utils.device_height=function(){
return (window.innerHeight>0)?window.innerHeight:screen.height;
}
vweb.utils.endpoint=function(url){
if (url==null){
return vweb.utils.endpoint(window.location.href);
}else {
let endpoint=url.replace("https://","").replace("http://","");
endpoint=endpoint.substr(endpoint.indexOf('/'),endpoint.length);
let end;
if ((end=endpoint.indexOf("?"))!==-1){
endpoint=endpoint.substr(0,end);
}
endpoint=endpoint.replaceAll("//","/");
if (endpoint.length==0){
return '/'
}else {
while (endpoint.length>1&&endpoint[endpoint.length-1]=='/'){
endpoint=endpoint.substr(0,endpoint.length-1);
}
}
return endpoint;
}
}
vweb.utils.redirect=function(url,forced=false){
if (forced||vweb.utils.endpoint()!=url){
window.location.href=url;
}
}
vweb.utils.delay=function(mseconds,func){
setTimeout(()=>func(),mseconds);
}
vweb.utils.url_param=function(name,def=null){
const params=new URLSearchParams(window.location.search);
const param=params.get(name);
if (param==null||param==""){
return def;
}
switch (param){
case "true":case "True":case "TRUE":return true;
case "false":case "False":case "FALSE":return false;
case "null":return null;
}
return param;
}
vweb.utils.url_encode=function(params){
const encodedParams=[];
Object.keys(params).iterate((key)=>{
const encodedKey=encodeURIComponent(key);
const encodedValue=encodeURIComponent(params[key]);
encodedParams.push(`${encodedKey}=${encodedValue}`);
});
return encodedParams.join('&');
}
vweb.utils.copy_to_clipboard=async function(text){
return new Promise((resolve,reject)=>{
navigator.clipboard.writeText(text)
.then((args)=>{
resolve(args)
})
.catch((err)=>{
reject(err)
});
});
}
vweb.utils.hex_brightness=function(color){
color=color.replace(/^#/,'');
const bigint=parseInt(color,16);
const r=(bigint>>16)&255;
const g=(bigint>>8)&255;
const b=bigint&255;
const brightness=(0.299*r+0.587*g+0.114*b)/255;
return brightness;
}
vweb.utils.hex_to_rgb=function(hex){
const index=hex.indexOf("#")
if (index!==-1){
hex=hex.substr(index+1);
}
let r=parseInt(hex.substring(0,2),16);
let g=parseInt(hex.substring(2,4),16);
let b=parseInt(hex.substring(4,6),16);
let a=1;
if (hex.length>6){
a=parseInt(hex.substring(6,8))/100;
}
return {r,g,b,a};
}
vweb.utils.deep_copy=(obj)=>{
if (Array.isArray(obj)){
const copy=[];
obj.iterate((item)=>{
copy.append(vweb.utils.deep_copy(item));
})
return copy;
}
else if (obj!==null&&obj instanceof String){
return new String(obj.toString());
}
else if (obj!==null&&typeof obj==="object"){
const copy={};
const keys=Object.keys(obj);
const values=Object.values(obj);
for (let i=0;i<keys.length;i++){
copy[keys[i]]=vweb.utils.deep_copy(values[i]);
}
return copy;
}
else {
return obj;
}
}
vweb.utils.request=function({
method="GET",
url=null,
data=null,
json=true,
credentials="same-origin",
headers={},
}){
if (json&&data!==null&&headers['Content-Type']==null){
headers['Content-Type']='application/json';
}
if (data!==null&&typeof data==="object"){
if (method==="GET"||method==="get"){
url+="?"+new URLSearchParams(data).toString();;
data=undefined;
}
else {
data=JSON.stringify(data);
}
}
const options={
method,
credentials,
headers,
body:data,
};
return new Promise((resolve,reject)=>{
fetch(url,options)
.then(response=>{
if (!response.ok){
if (json){
const clone=response.clone();
response.json().then(data=>{
if (data.status===undefined){
data.status=response.status;
}
reject(data);
}).catch(err=>{
clone.text()
.then(data=>{
reject({
error:data,
status:response.status
});
})
.catch(text_err=>{
reject({
error:err,
status:response.status
});
})
});
}
else {
reject({
error:response.statusText,
status:response.status
});
}
return;
}
if (json){
response.json().then(data=>{
resolve(data,response.status);
}).catch(err=>{
console.log("Response:",response)
reject({
error:'Failed to parse JSON response: '+err.message,
status:response.status
});
});
}else {
response.text().then(data=>{
resolve(data,response.status);
}).catch(err=>{
console.log("Response:",response)
reject({
error:'Failed to parse text response: '+err.message,
status:response.status
});
});
}
})
.catch(error=>{
reject({error:error.message});
});
});
}
vweb.utils.on_load=async function(func){
const splash=document.getElementById("__vweb_splash_screen");
if (splash!=null){
splash.remove();
}
let e=func();
if (e instanceof Promise){
try {
e=await e;
}catch (err){
console.error(err);
return null;
}
}
if (e!=null){
document.body.appendChild(e);
}
}
vweb.utils.unix_to_date=function(unix,mseconds=null){
if (mseconds===null){
const str=unix.toString();
if (str.length===13){
mseconds=true;
}else if (str.length===10){
mseconds=false;
}else {
if (str.length>10&&str.length<13){
const futureCheck=new Date(parseInt(str+"000",10));
if (futureCheck.getFullYear()>new Date().getFullYear()&&futureCheck.getFullYear()<3000){
mseconds=false;
}
}
}
}
const date=new Date(mseconds?unix:unix*1000);
const lang=navigator.language||navigator.userLanguage;
const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
let options={
year:"numeric",
month:"2-digit",
day:"2-digit",
timeZone:tz,
};
const date_format=new Intl.DateTimeFormat(lang,options).format(date);
options={
hour:"2-digit",
minute:"2-digit",
second:"2-digit",
hour12:lang.toLowerCase().includes("en"),
timeZone:tz,
}
const time_format=new Intl.DateTimeFormat(lang,options).format(date);
return `${date_format} ${time_format}`;
}
vweb.utils.fuzzy_search=({
query,
targets=[],
limit=25,
case_match=false,
allow_exceeding_chars=true,
get_matches=false,
key=null,
nested_key=null,
})=>{
if (query==null){
throw Error("Define parameter \"query\".");
}
const is_obj=targets.length>0&&typeof targets[0]==="object";
const is_array=targets.length>0&&Array.isArray(targets[0]);
if (is_obj&&key==null){key="query";}
const is_key_array=Array.isArray(key);
const results=[];
if (case_match===false){query=query.toLowerCase();}
const calc_sims=(targets=[])=>{
for (let i=0;i<targets.length;i++){
let match;
if (is_array){
match=vweb.utils.fuzzy_match(
query,
case_match?targets[i][0]:targets[i][0].toLowerCase(),
allow_exceeding_chars
);
}else if (is_obj){
const target=targets[i];
if (is_key_array){
let min_match=null;
for (let k=0;k<key.length;k++){
if (target[key[k]]==null){continue;}
match=vweb.utils.fuzzy_match(
query,
case_match?target[key[k]]:target[key[k]].toLowerCase(),
allow_exceeding_chars
);
if (match!=null&&(min_match===null||match<min_match)){
min_match=match;
}
}
match=min_match;
}else {
if (target[key]==null){continue;}
match=vweb.utils.fuzzy_match(
query,
case_match?target[key]:target[key].toLowerCase(),
allow_exceeding_chars
);
}
if (nested_key!==null&&target[nested_key]!=null){
calc_sims(target[nested_key]);
}
}else {
if (targets[i]==null){continue;}
match=vweb.utils.fuzzy_match(
query,
case_match?targets[i]:targets[i].toLowerCase(),
allow_exceeding_chars
);
}
if (match!==null){
results.push([match,targets[i]]);
}
}
}
calc_sims(targets);
results.sort((a,b)=>b[0]-a[0]);
if (limit!==null&&limit>=0&&results.length>limit){
results.length=limit;
}
if (get_matches===false){
let converted=[];
results.iterate((item)=>{
converted.push(item[1]);
})
return converted;
}
return results;
}
vweb.utils.fuzzy_match=(search,target,allow_exceeding_chars=true)=>{
if (allow_exceeding_chars===false){
if (search.length>target.length){
return null;
}
let text_count={};
for (let i=0;i<target.length;i++){
const c=target.charAt(i);
if (text_count[c]==null){
text_count[c]=1;
}else {
++text_count[c];
}
}
let query_count={};
for (let i=0;i<search.length;i++){
const c=search.charAt(i);
if (query_count[c]==null){
query_count[c]=1;
}else {
++query_count[c];
}
if (text_count[c]==null||query_count[c]>text_count[c]){
return null;
}
}
}
const get_search_code=(index)=>{
if (index>=0&&index<search.length){
return search.charCodeAt(index);
}
return-1;
};
const get_target_code=(index)=>{
if (index>=0&&index<target.length){
return target.charCodeAt(index);
}
return-1;
};
var prepareBeginningIndexes=(target)=>{
var targetLen=target.length
var beginningIndexes=[]; var beginningIndexesLen=0
var wasUpper=false
var wasAlphanum=false
for(var i=0;i<targetLen;++i){
var targetCode=target.charCodeAt(i)
var isUpper=targetCode>=65&&targetCode<=90
var isAlphanum=isUpper||targetCode>=97&&targetCode<=122||targetCode>=48&&targetCode<=57
var isBeginning=isUpper&&!wasUpper||!wasAlphanum||!isAlphanum
wasUpper=isUpper
wasAlphanum=isAlphanum
if(isBeginning)beginningIndexes[beginningIndexesLen++]=i
}
return beginningIndexes
}
var prepareNextBeginningIndexes=(target)=>{
var targetLen=target.length
var beginningIndexes=prepareBeginningIndexes(target)
var nextBeginningIndexes=[];
var lastIsBeginning=beginningIndexes[0]
var lastIsBeginningI=0
for(var i=0;i<targetLen;++i){
if(lastIsBeginning>i){
nextBeginningIndexes[i]=lastIsBeginning
}else {
lastIsBeginning=beginningIndexes[++lastIsBeginningI]
nextBeginningIndexes[i]=lastIsBeginning===undefined?targetLen:lastIsBeginning
}
}
return nextBeginningIndexes
}
let searchI=0;
let searchLen=search.length;
let searchCode=get_search_code(searchI);
let searchLower=search.toLowerCase();
let targetI=0;
let targetLen=target.length;
let targetCode=get_target_code(targetI);
let targetLower=target.toLowerCase();
let matchesSimple=[];
let matchesSimpleLen=0;
let successStrict=false
let matchesStrict=[];
let matchesStrictLen=0
for(;;){
var isMatch=searchCode===get_target_code(targetI)
if(isMatch){
matchesSimple[matchesSimpleLen++]=targetI
++searchI;
if(searchI===searchLen) break
searchCode=get_search_code(searchI)
}
++targetI;
if(targetI>=targetLen){
return null
}
}
searchI=0
targetI=0
nextBeginningIndexes=prepareNextBeginningIndexes(target);
var firstPossibleI=targetI=matchesSimple[0]===0?0:nextBeginningIndexes[matchesSimple[0]-1];
var backtrackCount=0
if(targetI!==targetLen){
for(;;){
if(targetI>=targetLen){
if(searchI<=0) break 
 ++backtrackCount; if(backtrackCount>200) break 
 --searchI
var lastMatch=matchesStrict[--matchesStrictLen]
targetI=nextBeginningIndexes[lastMatch]
}else {
var isMatch=get_search_code(searchI)===get_target_code(targetI)
if(isMatch){
matchesStrict[matchesStrictLen++]=targetI
++searchI; if(searchI===searchLen){successStrict=true; break }
++targetI
}else {
targetI=nextBeginningIndexes[targetI]
}
}
}
}
var substringIndex=targetLower.indexOf(searchLower,matchesSimple[0]);
var isSubstring=~substringIndex;
if(isSubstring&&!successStrict){
for(var i=0;i<matchesSimpleLen;++i){
matchesSimple[i]=substringIndex+i
}
}
var isSubstringBeginning=false;
if(isSubstring){
isSubstringBeginning=nextBeginningIndexes[substringIndex-1]===substringIndex
}
{
if(successStrict){var matchesBest=matchesStrict; var matchesBestLen=matchesStrictLen}
else {var matchesBest=matchesSimple; var matchesBestLen=matchesSimpleLen}
var score=0
var extraMatchGroupCount=0
for(var i=1;i<searchLen;++i){
if(matchesBest[i]-matchesBest[i-1]!==1){
score-=matchesBest[i];
++extraMatchGroupCount
}
}
var unmatchedDistance=matchesBest[searchLen-1]-matchesBest[0]-(searchLen-1)
score-=(12+unmatchedDistance)*extraMatchGroupCount
if(matchesBest[0]!==0)score-=matchesBest[0]*matchesBest[0]*.2
if(!successStrict){
score*=1000
}else {
var uniqueBeginningIndexes=1
for(var i=nextBeginningIndexes[0];i<targetLen;i=nextBeginningIndexes[i]){
++uniqueBeginningIndexes
}
if(uniqueBeginningIndexes>24)score*=(uniqueBeginningIndexes-24)*10
}
if(isSubstring)score/=1+searchLen*searchLen*1;
if(isSubstringBeginning)score/=1+searchLen*searchLen*1;
score-=targetLen-searchLen;
return score
}
}
vweb.utils.debounce=(delay,func)=>{
let timeout;
return function(...args){
clearTimeout(timeout);
timeout=setTimeout(()=>func.apply(this,args),delay);
};
}
vweb.elements={};
vweb.elements.get=function(id){
const e=document.getElementById(id);
if (e==null){
throw Error(`Unable to find element with id "${id}".`)
}
return e;
}
vweb.elements.get_by_id=function(id){
return vweb.elements.get(id)
}
vweb.elements.click=function(id){
document.getElementById(id).click();
}
vweb.elements.register=function(type,tag){
customElements.define("v-"+type.name.toLowerCase(),type,{extends:tag||type.element_tag});
}
vweb.elements.submit=function(...elements){
const params={};
let error;
for (let i=0;i<elements.length;i++){
try {
let element=elements[i];
if (typeof element==="string"){
element=vweb.elements.get(element);
}
const id=element.id();
if (id==null||id===""){
continue;
}
if (element.required()!==true){
params[id]=element.value();
}else {
params[id]=element.submit();
}
}catch(e){
error=e;
}
}
if (error){
throw error;
}
return params;
}
vweb.elements.forward_func_to_child=(func_name,child)=>{
return function(val){
console.log("OIOI")
if (typeof child==="function"){
child=child(this);
}
if (val==null){return child[func_name]()};
console.log("before",child[func_name]())
child[func_name](val);
console.log("after",child[func_name]())
return this;
}
}
vweb.google={}
vweb.google.id="{{GOOGLE_TAG}}";
vweb.google.enable_tracking=function(){
delete window[`ga-disable-${vweb.google.id}`];
}
vweb.google.disable_tracking=function(){
window[`ga-disable-${vweb.google.id}`]=true;
}
if (vweb.google.id!=null&&vweb.google.id!=""){
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config',vweb.google.id);
}
vweb.cookies={};
vweb.cookies.is_parse_required=function(){
return document.cookie!==this._last_cookies;
}
vweb.cookies.get=function(name=null){
if (document.cookie===this._last_cookies){
if (name!=null){
return this._cookies[name];
}
return this._cookies;
}
this._cookies={};
this._last_cookies=document.cookie;
let is_key=true,is_str=null;
let key="",value="";
const append=()=>{
if (key.length>0){
this._cookies[key]=value;
}
value="";
key="";
is_key=true;
is_str=null;
}
for (let i=0;i<document.cookie.length;i++){
const c=document.cookie.charAt(i);
if (is_key){
if (c===" "||c==="\t"){
continue;
}
else if (c==="="){
is_key=false;
}else {
key+=c;
}
}
else {
if (is_str!=null&&is_str===c){
value=value.substr(1,value.length-1);
append();
}
else if (c===";"){
append();
}
else {
if (value.length===0&&(c==="\""||c==="'")){
is_str=c;
}
value+=c;
}
}
}
append();
if (name!=null){
return this._cookies[name];
}
return this._cookies;
}
vweb.cookies.has_preference=function(){
const pref=localStorage.getItem("vweb_cookies_enabled");
return pref==="true"||pref==="false";
}
vweb.cookies.is_accepted=function(){
return localStorage.getItem("vweb_cookies_enabled")==="true";
}
vweb.cookies.enable=function(_set_storage=true){
this._disabled=true;
if (_set_storage){
localStorage.setItem("vweb_cookies_enabled","true");
}
vweb.google.disable_tracking();
}
vweb.cookies.disable=function(_set_storage=true){
this._disabled=false;
if (_set_storage){
localStorage.setItem("vweb_cookies_enabled","false");
}
vweb.google.enable_tracking();
}
vweb.cookies._init=function(){
if (this.is_accepted()){
vweb.cookies.enable(false);
}else {
vweb.cookies.disable(false);
}
}
vweb.cookies._init();
class MutexElement{
constructor(){
this.locked=false;
this.queue=[];
}
async lock(){
if (!this.locked){
this.locked=true;
return Promise.resolve();
}else {
return new Promise((resolve)=>{
this.queue.push(resolve);
});
}
}
unlock(){
if (this.queue.length>0){
const nextResolve=this.queue.shift();
nextResolve();
}else {
this.locked=false;
}
}
};function Mutex(...args){return new MutexElement(...args)};
vweb.elements.elements_with_width_attribute=[
'canvas',
'embed',
'iframe',
'img',
'object',
'progress',
'video',
];
vweb.is_safari=navigator.vendor.includes('Apple');
vweb._velement_classes=[];
vweb.extend_velement=(props={})=>{
const names=Object.keys(props);
vweb._velement_classes.iterate(Element=>{
for (let i=0;i<names.length;i++){
Element.prototype[names[i]]=props[names[i]];
}
})
}
vweb.utils.on_render_observer=new ResizeObserver(
(entries,observer)=>{
entries.forEach(entry=>{
if (!entry.target.rendered){
entry.target._on_render_callbacks.iterate((func)=>func(entry.target));
entry.target.rendered=true;
vweb.utils.on_render_observer.unobserve(entry.target);
}
});
},
);
vweb.utils.on_resize_observer=new ResizeObserver(
(entries,observer)=>{
entries.forEach(entry=>{
entry.target._on_resize_callbacks.iterate((func)=>func(entry.target));
});
},
);
function CreateVElementClass({
type="VElement",
tag="div",
default_style=null,
default_attributes=null,
default_events=null,
}){
let Base;
if (tag==="style"){
class B{
constructor(){
this.style={};
}
}
Base=B;
}
else if (vweb.is_safari){
Base=HTMLElement;
}
else {
switch (tag){
case "a":
Base=HTMLAnchorElement;
break;
case "area":
Base=HTMLAreaElement;
break;
case "audio":
Base=HTMLAudioElement;
break;
case "base":
Base=HTMLBaseElement;
break;
case "blockquote":
Base=HTMLQuoteElement;
break;
case "body":
Base=HTMLBodyElement;
break;
case "br":
Base=HTMLBRElement;
break;
case "button":
Base=HTMLButtonElement;
break;
case "canvas":
Base=HTMLCanvasElement;
break;
case "caption":
Base=HTMLTableCaptionElement;
break;
case "col":
Base=HTMLTableColElement;
break;
case "data":
Base=HTMLDataElement;
break;
case "datalist":
Base=HTMLDataListElement;
break;
case "dl":
Base=HTMLDListElement;
break;
case "dir":
Base=HTMLDirectoryElement;
break;
case "div":
Base=HTMLDivElement;
break;
case "html":
Base=HTMLHtmlElement;
break;
case "embed":
Base=HTMLEmbedElement;
break;
case "fieldset":
Base=HTMLFieldSetElement;
break;
case "form":
Base=HTMLFormElement;
break;
case "h1":
Base=HTMLHeadingElement;
break;
case "h2":
Base=HTMLHeadingElement;
break;
case "h3":
Base=HTMLHeadingElement;
break;
case "h4":
Base=HTMLHeadingElement;
break;
case "h5":
Base=HTMLHeadingElement;
break;
case "h6":
Base=HTMLHeadingElement;
break;
case "head":
Base=HTMLHeadElement;
break;
case "hr":
Base=HTMLHRElement;
break;
case "img":
Base=HTMLImageElement;
break;
case "input":
Base=HTMLInputElement;
break;
case "ins":
Base=HTMLModElement;
break;
case "label":
Base=HTMLLabelElement;
break;
case "legend":
Base=HTMLLegendElement;
break;
case "li":
Base=HTMLLIElement;
break;
case "link":
Base=HTMLLinkElement;
break;
case "map":
Base=HTMLMapElement;
break;
case "meta":
Base=HTMLMetaElement;
break;
case "meter":
Base=HTMLMeterElement;
break;
case "object":
Base=HTMLObjectElement;
break;
case "ol":
Base=HTMLOListElement;
break;
case "optgroup":
Base=HTMLOptGroupElement;
break;
case "option":
Base=HTMLOptionElement;
break;
case "output":
Base=HTMLOutputElement;
break;
case "p":
Base=HTMLParagraphElement;
break;
case "param":
Base=HTMLParamElement;
break;
case "picture":
Base=HTMLPictureElement;
break;
case "pre":
Base=HTMLPreElement;
break;
case "progress":
Base=HTMLProgressElement;
break;
case "q":
Base=HTMLQuoteElement;
break;
case "script":
Base=HTMLScriptElement;
break;
case "select":
Base=HTMLSelectElement;
break;
case "slot":
Base=HTMLSlotElement;
break;
case "source":
Base=HTMLSourceElement;
break;
case "span":
Base=HTMLSpanElement;
break;
case "table":
Base=HTMLTableElement;
break;
case "thead":
Base=HTMLTableSectionElement;
break;
case "tbody":
Base=HTMLTableSectionElement;
break;
case "tfoot":
Base=HTMLTableSectionElement;
break;
case "th":
Base=HTMLTableCellElement;
break;
case "td":
Base=HTMLTableCellElement;
break;
case "template":
Base=HTMLTemplateElement;
break;
case "textarea":
Base=HTMLTextAreaElement;
break;
case "time":
Base=HTMLTimeElement;
break;
case "title":
Base=HTMLTitleElement;
break;
case "tr":
Base=HTMLTableRowElement;
break;
case "track":
Base=HTMLTrackElement;
break;
case "ul":
Base=HTMLUListElement;
break;
default:
Base=HTMLElement;
break;
};
}
class Element extends Base{
static element_tag=tag;
static default_style=default_style;
static default_attributes=default_attributes;
static default_events=default_events;
constructor(){
super();
this.element_type=type;
this.base_element_type=type;
this.element_display="block";
this.remove_focus=super.blur;
this.rendered=false;
if (this.hasAttribute!==undefined&&this.hasAttribute("created_by_html")){
}
else {
if (Element.default_style!=null){
this.styles(Element.default_style);
}
if (Element.default_attributes!=null){
this.attrs(Element.default_attributes);
}
if (Element.default_events!=null){
this.events(Element.default_events);
}
}
}
connectedCallback(){
this._is_connected=true;
}
clone(clone_children=true){
const clone=new this.constructor();
if (clone.element_type!==undefined){
clone.inner_html("");
}
const styles=window.getComputedStyle(this);
clone.style.cssText=Array.from(styles).reduce((str,property)=>{
return `${str}${property}:${styles.getPropertyValue(property)};`;
},'');
const auto_keys=[
"width",
"minWidth",
"maxWidth",
"height",
"minHeight",
"maxHeight",
];
for (let i=0;i<auto_keys.length;i++){
if (this.style[auto_keys[i]]=="auto"||this.style[auto_keys[i]]==""){
clone.style[auto_keys[i]]="auto";
}
}
for (const attr of this.getAttributeNames()){
if (attr!="style"){
clone.setAttribute(attr, this.getAttribute(attr));
}
}
for (const prop in this){
if (this.hasOwnProperty(prop)||typeof this[prop]==="function"){
clone[prop]=this[prop];
}
}
if (clone_children&&this.childNodes!=undefined){
for (let i=0;i<this.childNodes.length;i++){
const child=this.childNodes[i];
if (child.element_type===undefined){
clone.appendChild(child.cloneNode(true));
}else {
clone.appendChild(child.clone());
}
}
}
return clone;
}
pad_numeric(value,padding="px"){
if (vweb.utils.is_numeric(value)){
return value+padding;
}
return value;
}
pad_percentage(value,padding="%"){
if (vweb.utils.is_float(value)&&value<=1.0){
return (value*100)+padding;
}else if (vweb.utils.is_numeric(value)){
return value+padding;
}
return value;
}
edit_filter_wrapper(filter,type,to=null){
if (filter==null){
return to;
}
const pattern=new RegExp(`${type}\\([^)]*\\)\\s*`,"g");
if (pattern.test(filter)){
if (to==null){
return filter.replace(pattern,"");
}else {
return filter.replace(pattern,to);
}
}else if (to!=null){
return `${filter} ${to}`;
}
return value;
}
toggle_filter_wrapper(filter,type,to=null){
if (filter==null){
return to;
}
const pattern=new RegExp(`${type}\\([^)]*\\)\\s*`,"g");
if (pattern.test(filter)){
return filter.replace(pattern,"");
}else if (to!=null){
return `${filter} ${to}`;
}
return value;
}
_convert_px_to_number_type(value){
if (value==null||value===""){return 0;}
else if (typeof value==="string"&&value.eq_last("px")){
value=parseFloat(value)
if (isNaN(value)){return 0;}
}
return value;
}
_try_parse_float(value){
if (typeof value==="string"&&(value.endsWith("em")||value.endsWith("rem"))){return value;}
const float=parseFloat(value);
if (!isNaN(float)){return float;}
return value;
}
append(...children){
for (let i=0;i<children.length;i++){
let child=children[i];
if (child!=null){
if (Array.isArray(child)){
this.append(...child);
}
else if (child.element_type!=null){
if (
child.element_type=="ForEach"||
child.element_type=="If"||
child.element_type=="IfDeviceWith"
){
child.append_children_to(this, this._on_append_callback);
}else {
if (child._assign_to_parent_as!==undefined){
this[child._assign_to_parent_as]=child;
child._parent=this;
}
if (this._on_append_callback!==undefined){
this._on_append_callback(child)
}
this.appendChild(child);
}
}
else if (vweb.utils.is_func(child)){
this.append(child(this));
}
else if (child instanceof Node){
if (child._assign_to_parent_as!==undefined){
this[child._assign_to_parent_as]=child;
child._parent=this;
}
if (this._on_append_callback!==undefined){
this._on_append_callback(child)
}
this.appendChild(child);
}
else if (vweb.utils.is_string(child)){
const node=document.createTextNode(child);
if (this._on_append_callback!==undefined){
this._on_append_callback(node)
}
this.appendChild(node);
}
}
}
return this;
}
zstack_append(...children){
for (let i=0;i<children.length;i++){
let child=children[i];
if (child!=null){
if (Array.isArray(child)){
this.zstack_append(...child);
}
else if (child.element_type!=null){
child.style.gridArea="1 / 1 / 2 / 2";
if (
child.element_type=="ForEach"||
child.element_type=="If"||
child.element_type=="IfDeviceWith"
){
child.append_children_to(this, this._on_append_callback);
}else {
if (child._assign_to_parent_as!==undefined){
this[child._assign_to_parent_as]=child;
child._parent=this;
}
if (this._on_append_callback!==undefined){
this._on_append_callback(child)
}
this.appendChild(child);
}
}
else if (vweb.utils.is_func(child)){
this.append(child(this));
}
else if (child instanceof Node){
child.style.gridArea="1 / 1 / 2 / 2";
if (child._assign_to_parent_as!==undefined){
this[child._assign_to_parent_as]=child;
child._parent=this;
}
if (this._on_append_callback!==undefined){
this._on_append_callback(child)
}
this.appendChild(child);
}
else if (vweb.utils.is_string(child)){
const node=document.createTextNode(child);
if (this._on_append_callback!==undefined){
this._on_append_callback(node)
}
this.appendChild(node);
}
}
}
return this;
}
append_to(parent){
if (this._assign_to_parent_as!==undefined){
parent[this._assign_to_parent_as]=this;
child._parent=this;
}
if (parent._on_append_callback!==undefined){
parent._on_append_callback(this);
}
parent.appendChild(this);
return this;
}
append_children_to(parent,on_append_callback){
if (this.base_element_type=="VirtualScroller"){
for (let i=0;i<parent.children.length;i++){
parent.v_children.push(parent.children[i]);
}
this.innerHTML="";
}else {
while (this.firstChild){
if (this.firstChild._assign_to_parent_as!==undefined){
parent[this.firstChild._assign_to_parent_as]=this.firstChild;
this.firstChild._parent=parent;
}
if (on_append_callback!==undefined){
on_append_callback(this.firstChild);
}
parent.appendChild(this.firstChild)
}
}
return this;
}
remove_child(child){
if (child.element_type!=null){
this.removeChild(child);
}else if (child instanceof Node){
this.removeChild(child);
}else if (vweb.utils.is_string(child)){
this.removeChild(document.getElementById(child));
}else {
console.error("Invalid parameter type for function \"remove_child()\".");
}
return this;
}
remove_children(){
this.inner_html("");
return this;
}
child(index){
if (index<0){
return this.children[this.children.length-index];
}
return this.children[index];
}
get(index){
if (index<0){
return this.children[this.children.length-index];
}
else if (index>=this.children.length){
return undefined;
}
return this.children[index];
}
text(value){
if (value==null){
return this.textContent;
}
this.textContent=value;
return this;
}
width(value,check_attribute=true){
if (check_attribute&&vweb.elements.elements_with_width_attribute.includes(Element.element_tag)){
if (value==null){
return this._try_parse_float(this.getAttribute("width"));
}
this.setAttribute("width",value);
}else {
if (value==null){
return this._try_parse_float(this.style.width);
}
this.style.width=this.pad_numeric(value);
}
return this;
}
fixed_width(value){
if (value==null){
return this._try_parse_float(this.style.width);
}
value=this.pad_numeric(value);
this.style.width=value;
this.style.minWidth=value;
this.style.maxWidth=value;
return this;
}
height(value,check_attribute=true){
if (check_attribute&&vweb.elements.elements_with_width_attribute.includes(Element.element_tag)){
if (value==null){
return this._try_parse_float(this.getAttribute("height"));
}
this.setAttribute("height",value);
}else {
if (value==null){
return this._try_parse_float(this.style.height);
}
this.style.height=this.pad_numeric(value);
}
return this;
}
fixed_height(value){
if (value==null){
return this._try_parse_float(this.style.height);
}
value=this.pad_numeric(value);
this.style.height=value;
this.style.minHeight=value;
this.style.maxHeight=value;
return this;
}
min_height(value){
if (value==null){return this._try_parse_float(this.style.minHeight);}
this.style.minHeight=this.pad_numeric(value);
return this;
}
min_width(value){
if (value==null){return this._try_parse_float(this.style.minWidth);}
this.style.minWidth=this.pad_numeric(value);
return this;
}
width_by_columns(columns){
let margin_left=this.style.marginLeft;
let margin_right=this.style.marginRight;
if (!margin_left){
margin_left="0px";
}
if (!margin_right){
margin_right="0px";
}
if (columns==null){
columns=1;
}
this.style.flexBasis="calc(100% / "+columns+" - ("+margin_left+" + "+margin_right+"))";
return this;
}
offset_width(){
return this.offsetWidth;
}
offset_height(){
return this.offsetHeight;
}
client_width(){
return this.clientWidth;
}
client_height(){
return this.clientHeight;
}
x(){
return this.offsetLeft;
}
y(){
return this.offsetTop;
}
frame(width,height){
if (width!=null){
this.width(width);
}
if (height!=null){
this.height(height);
}
return this;
}
min_frame(width,height){
if (width!=null){
this.min_width(width);
}
if (height!=null){
this.min_height(height);
}
return this;
}
max_frame(width,height){
if (width!=null){
this.max_width(width);
}
if (height!=null){
this.max_height(height);
}
return this;
}
fixed_frame(width,height){
if (width!=null){
width=this.pad_numeric(width);
this.style.width=width;
this.style.minWidth=width;
this.style.maxWidth=width;
}
if (height!=null){
height=this.pad_numeric(height);
this.style.height=height;
this.style.minHeight=height;
this.style.maxHeight=height;
}
return this;
}
get_frame_while_hidden(){
const transition=this.transition();
this.transition("none");
const max_width=this.max_width();
this.max_width("none");
const max_height=this.max_height();
this.max_height("none");
const overflow=this.overflow();
this.overflow("visible");
this.visibility("hidden");
this.show();
const rect=this.getBoundingClientRect();
const response={width:this.clientWidth,height:this.clientHeight};
this.hide();
this.visibility("visible");
this.max_width(max_width)
this.max_height(max_height)
this.transition(transition)
this.overflow(overflow)
return response;
}
padding(...values){
if (values.length===0){
return this.style.padding;
}else if (values.length===1){
this.style.padding=this.pad_numeric(values[0]);
}else if (values.length===2){
if (values[0]!=null){
this.style.paddingTop=this.pad_numeric(values[0]);
}
if (values[1]!=null){
this.style.paddingRight=this.pad_numeric(values[1]);
}
if (values[0]!=null){
this.style.paddingBottom=this.pad_numeric(values[0]);
}
if (values[1]!=null){
this.style.paddingLeft=this.pad_numeric(values[1]);
}
}else if (values.length===4){
this.style.paddingTop=this.pad_numeric(values[0]);
if (values[1]!=null){
this.style.paddingRight=this.pad_numeric(values[1]);
}
if (values[2]!=null){
this.style.paddingBottom=this.pad_numeric(values[2]);
}
if (values[3]!=null){
this.style.paddingLeft=this.pad_numeric(values[3]);
}
}else {
console.error("Invalid number of arguments for function \"padding()\".");
}
return this;
}
padding_bottom(value){
if (value==null){return this._convert_px_to_number_type(this.style.paddingBottom);}
this.style.paddingBottom=this.pad_numeric(value);
return this;
}
padding_left(value){
if (value==null){return this._convert_px_to_number_type(this.style.paddingLeft);}
this.style.paddingLeft=this.pad_numeric(value);
return this;
}
padding_right(value){
if (value==null){return this._convert_px_to_number_type(this.style.paddingRight);}
this.style.paddingRight=this.pad_numeric(value);
return this;
}
padding_top(value){
if (value==null){return this._convert_px_to_number_type(this.style.paddingTop);}
this.style.paddingTop=this.pad_numeric(value);
return this;
}
margin(...values){
if (values.length===0){
return this.style.margin;
}else if (values.length===1){
this.style.margin=this.pad_numeric(values[0]);
}else if (values.length===2){
this.style.marginTop=this.pad_numeric(values[0]);
if (values[1]!=null){
this.style.marginRight=this.pad_numeric(values[1]);
}
if (values[0]!=null){
this.style.marginBottom=this.pad_numeric(values[0]);
}
if (values[1]!=null){
this.style.marginLeft=this.pad_numeric(values[1]);
}
}else if (values.length===4){
this.style.marginTop=this.pad_numeric(values[0]);
if (values[1]!=null){
this.style.marginRight=this.pad_numeric(values[1]);
}
if (values[2]!=null){
this.style.marginBottom=this.pad_numeric(values[2]);
}
if (values[3]!=null){
this.style.marginLeft=this.pad_numeric(values[3]);
}
}else {
console.error("Invalid number of arguments for function \"margin()\".");
}
return this;
}
margin_bottom(value){
if (value==null){return this._convert_px_to_number_type(this.style.marginBottom);}
this.style.marginBottom=this.pad_numeric(value);
return this;
}
margin_left(value){
if (value==null){return this._convert_px_to_number_type(this.style.marginLeft);}
this.style.marginLeft=this.pad_numeric(value);
return this;
}
margin_right(value){
if (value==null){return this._convert_px_to_number_type(this.style.marginRight);}
this.style.marginRight=this.pad_numeric(value);
return this;
}
margin_top(value){
if (value==null){return this._convert_px_to_number_type(this.style.marginTop);}
this.style.marginTop=this.pad_numeric(value);
return this;
}
position(...values){
if (values.length===0){
return this.style.position;
}else if (values.length===1){
this.style.position=values[0];
}else if (values.length===4){
this.style.position="absolute";
if (values[0]!=null){
this.style.top=this.pad_numeric(values[0]);
}
if (values[1]!=null){
this.style.right=this.pad_numeric(values[1]);
}
if (values[2]!=null){
this.style.bottom=this.pad_numeric(values[2]);
}
if (values[3]!=null){
this.style.left=this.pad_numeric(values[3]);
}
}else {
console.error("Invalid number of arguments for function \"position()\".");
}
return this;
}
stretch(value){
if (value==true){
this.style.flex=1;
}else {
this.style.flex=0;
}
return this;
}
wrap(value){
switch (Element.element_tag){
case "div":
if (value==true){
this.flex_wrap("wrap")
}else if (value==false){
this.flex_wrap("nowrap")
}else {
this.flex_wrap(value)
}
break;
default:
if (value==true){
this.style.whiteSpace="wrap";
this.style.textWrap="wrap";
this.style.overflowWrap="break-word";
}else if (value==false){
this.style.whiteSpace="nowrap";
this.style.textWrap="nowrap";
this.style.overflowWrap="normal";
}else {
this.style.textWrap=value;
this.style.textWrap=value;
this.style.overflowWrap=value;
}
break;
}
return this;
}
z_index(value){
this.style.zIndex=value;
return this;
}
side_by_side({
columns=2,
hspacing=10,
vspacing=10,
stretch=true,
hide_dividers=false,
}){
if (this.element_type!=="HStack"&&this.element_type!=="AnchorHStack"){
throw Error("This function os only supported for element \"HStackElement\".");
}
let col_children=[];
let row_width=0;
let row=0;
let highest_margin=undefined;
this.box_sizing("border-box")
const flex_basis=(child,basis,margin)=>{
if (margin===0){
child.width(`${basis*100}%`);
child.min_width(`${basis*100}%`);
child.max_width(`${basis*100}%`);
}else {
child.width(`calc(${basis*100}% - ${margin}px)`);
child.min_width(`calc(${basis*100}% - ${margin}px)`);
child.max_width(`calc(${basis*100}% - ${margin}px)`);
}
}
const set_flex=()=>{
const margin=(columns-1)*hspacing;
let index=0;
col_children.iterate((i)=>{
const child=i[0];
if (index>0){
child.margin_left(hspacing)
}
if (stretch&&index+1===col_children.length){
let basis=i[1]==null?(1-((col_children.length-1)/columns)):i[1];
if (col_children.length===1){
basis=1.0;
}
flex_basis(
child,
basis,
margin/columns,
);
}else {
flex_basis(
child,
i[1]==null?1/columns:i[1],
margin/columns,
);
}
++index;
})
}
const is_last_non_divider=(child)=>{
if (child.nextElementSibling==null){
return true;
}else if (child.nextElementSibling.element_type!=="Divider"){
return false;
}else {
return is_last_non_divider(child.nextElementSibling);
}
}
this.iterate((child)=>{
if (child.element_type==="Divider"){
if (col_children.length>0&&hide_dividers){
child.hide();
}else {
child.show();
child.margin_top(vspacing)
child.margin_bottom(0)
flex_basis(child,1.0,0);
}
}
else {
if (columns===1){
child.fixed_width("100%");
child.stretch(true);
child.box_sizing("border-box")
child.margin_left(0);
if (row>0){
child.margin_top(vspacing);
}else {
child.margin_top(0);
}
++row;
}
else {
const is_last_node=is_last_non_divider(child)
const child_custom_basis=child._side_by_side_basis;
const basis=child_custom_basis==null?1/columns:child_custom_basis;
child.stretch(true);
child.box_sizing("border-box")
child.margin_left(0);
if (row>0){
child.margin_top(vspacing);
}else {
child.margin_top(0);
}
if (row_width+basis>1){
set_flex();
++row;
row_width=0;
col_children=[];
col_children.push([child,child_custom_basis]);
}
else if (row_width+basis===1||is_last_node){
col_children.push([child,child_custom_basis]);
set_flex();
++row;
row_width=0;
col_children=[];
}
else {
col_children.push([child,child_custom_basis]);
row_width+=basis;
}
}
}
})
return this;
}
side_by_side_basis(basis){
if (basis==null){return this._side_by_side_basis;}
else if (basis===false){
this._side_by_side_basis=undefined;
}else {
this._side_by_side_basis=basis;
}
return this;
}
ellipsis_overflow(to=true,after_lines=null){
if (to===null){
return this.style.textOverflow==="ellipsis";
}else if (to===true){
this.style.textOverflow="ellipsis";
this.style.overflow="hidden";
this.style.textWrap="wrap";
this.style.overflowWrap="break-word";
if (after_lines!=null){
this.style.webkitLineClamp=after_lines;
this.style.webkitBoxOrient="vertical";
this.style.display="-webkit-box";
}else {
this.style.whiteSpace="nowrap";
}
}else if (to===false){
this.style.textOverflow="default";
this.style.whiteSpace="default";
this.style.overflow="default";
this.style.textWrap="default";
this.style.overflowWrap="default";
}
return this;
}
align(value){
switch (this.base_element_type){
case "HStack":
case "AnchorHStack":
case "ZStack":
if (value==null){return this.style.justifyContent;}
if (value==="default"){value="";}
if (this.style.justifyContent!==value){
this.style.justifyContent=value;
}
return this;
case "Frame":
this.style.display="flex";
this.style.flexDirection="column";
case "VStack":
case "AnchorVStack":
case "Scroller":
case "View":
if (value==null){return this.style.alignItems;}
if (value==="default"){value="normal";}
if (this.style.alignItems!==value){
this.style.alignItems=value;
}
return this;
default:
if (value==null){return this.style.textAlign;}
if (value==="default"){value="normal";}
if (this.style.textAlign!==value){
this.style.textAlign=value;
}
return this;
}
}
leading(){
return this.align("start");
}
center(){
return this.align("center");
}
trailing(){
return this.align("end");
}
align_vertical(value){
switch (this.base_element_type){
case "HStack":
case "AnchorHStack":
case "ZStack":
if (value==null){return this.style.alignItems;}
if (value==="default"){value="normal";}
if (value!==this.style.alignItems){
this.style.alignItems=value;
}
return this;
case "Frame":
this.style.display="flex";
this.style.flexDirection="column";
case "VStack":
case "AnchorVStack":
case "Scroller":
case "View":
if (value==null){return this.style.justifyContent;}
if (value==="default"){value="";}
if (value!==this.style.justifyContent){
this.style.justifyContent=value;
}
return this;
case "Text":
if (value==null){return this.style.alignItems;}
if (this.style.display==null||!this.style.display.includes("flex")){
this.display("flex");
}
if (value!==this.style.alignItems){
this.style.alignItems=value;
}
return this;
default:
if (value==null){return this.style.justifyContent;}
if (value!==this.style.justifyContent){
this.style.justifyContent=value;
}
return this;
}
}
leading_vertical(){
return this.align_vertical("start");
}
center_vertical(only_on_no_overflow=false){
if (only_on_no_overflow){
this.on_render((e)=>{
setTimeout(()=>{
if (e.scrollHeight>e.clientHeight){
e.align_vertical("default");
}else {
e.center_vertical();
}
},50)
})
this.on_resize((e)=>{
if (e.scrollHeight>e.clientHeight){
e.align_vertical("default");
}else {
e.center_vertical();
}
})
}
return this.align_vertical("center");
}
trailing_vertical(){
return this.align_vertical("end");
}
align_text(value){
return this.text_align(value);
}
text_leading(){
return this.text_align("start");
}
text_center(){
return this.text_align("center");
}
text_trailing(){
return this.text_align("end");
}
align_height(){
return this.align_items("stretch");
}
text_wrap(value){
if (value==null){return this.style.textWrap;}
this.style.textWrap=value;
return this;
}
line_clamp(value){
if (value==null){return this.style.webkitLineClamp;}
this.style.webkitLineClamp=value;
return this;
}
box_orient(value){
if (value==null){return this.style.webkitBoxOrient;}
this.style.webkitBoxOrient=value;
return this;
}
color(value){
if (value==null){return this.style.color;}
if (value instanceof GradientType){
this.style.backgroundImage=value.gradient;
this.style.backgroundClip="text";
this.style["-webkit-background-clip"]="text";
this.style.color="transparent";
}else if (value._is_gradient||value.eq_first("linear-gradient(")||value.eq_first("radial-gradient(")){
this.style.backgroundImage=value;
this.style.backgroundClip="text";
this.style["-webkit-background-clip"]="text";
this.style.color="transparent";
}else {
this.style.color=value;
}
return this;
}
border(...values){
if (values.length===0){
return this.style.border;
}else if (values.length===1){
this.style.border=values[0];
}else if (values.length===2){
this.style.border=this.pad_numeric(values[0])+" solid "+values[1];
}else if (values.length===3){
this.style.border=this.pad_numeric(values[0])+" ",values[1]+" "+values[2];
}else {
console.error("Invalid number of arguments for function \"border()\".");
}
return this;
}
border_top(...values){
if (values.length===0){
return this.style.borderTop;
}else if (values.length===1){
this.style.borderTop=values[0];
}else if (values.length===2){
this.style.borderTop=this.pad_numeric(values[0])+" solid "+values[1];
}else if (values.length===3){
this.style.borderTop=this.pad_numeric(values[0])+" ",values[1]+" "+values[2];
}else {
console.error("Invalid number of arguments for function \"border_top()\".");
}
return this;
}
border_bottom(...values){
if (values.length===0){
return this.style.borderBottom;
}else if (values.length===1){
this.style.borderBottom=values[0];
}else if (values.length===2){
this.style.borderBottom=this.pad_numeric(values[0])+" solid "+values[1];
}else if (values.length===3){
this.style.borderBottom=this.pad_numeric(values[0])+" ",values[1]+" "+values[2];
}else {
console.error("Invalid number of arguments for function \"border_bottom()\".");
}
return this;
}
border_right(...values){
if (values.length===0){
return this.style.borderRight;
}else if (values.length===1){
this.style.borderRight=values[0];
}else if (values.length===2){
this.style.borderRight=this.pad_numeric(values[0])+" solid "+values[1];
}else if (values.length===3){
this.style.borderRight=this.pad_numeric(values[0])+" ",values[1]+" "+values[2];
}else {
console.error("Invalid number of arguments for function \"border_right()\".");
}
return this;
}
border_left(...values){
if (values.length===0){
return this.style.borderLeft;
}else if (values.length===1){
this.style.borderLeft=values[0];
}else if (values.length===2){
this.style.borderLeft=this.pad_numeric(values[0])+" solid "+values[1];
}else if (values.length===3){
this.style.borderLeft=this.pad_numeric(values[0])+" ",values[1]+" "+values[2];
}else {
console.error("Invalid number of arguments for function \"border_left()\".");
}
return this;
}
shadow(...values){
if (values.length===0){
return this.style.boxShadow;
}
else if (values.length===1){
return this.box_shadow(this.pad_numeric(values[0]));
}else if (values.length===4){
return this.box_shadow(
this.pad_numeric(values[0])+" "+
this.pad_numeric(values[1])+" "+
this.pad_numeric(values[2])+" "+
values[3]
);
}else {
console.error("Invalid number of arguments for function \"shadow()\".");
}
}
drop_shadow(...values){
if (values.length===0||values.length===1&&values[0]==null){
return this.filter();
}else if (values.length===1){
return this.filter("drop-shadow("+this.pad_numeric(values[0])+") ");
}else if (values.length===4){
return this.filter(
"drop-shadow("+
this.pad_numeric(values[0])+" "+
this.pad_numeric(values[1])+" "+
this.pad_numeric(values[2])+" "+
values[3]+") "
);
}else {
console.error("Invalid number of arguments for function \"drop_shadow()\".");
}
}
greyscale(value){
if (value==null){
return this.filter();
}else {
return this.filter("grayscale("+this.pad_percentage(value,"")+") ");
}
}
opacity(value){
switch (this.base_element_type){
case "Style":
if (value==null){
return this.filter(this.edit_filter_wrapper(this.style.filter,"opacity",value));
}else {
if (value<=1.0){
value*=100;
}
return this.filter(this.edit_filter_wrapper(this.style.filter,"opacity","opacity("+value+") "));
}
default:
if (value==null){return this.style.opacity;}
this.style.opacity=value;
return this;
}
}
toggle_opacity(value=0.25){
if (typeof this.style.opacity==="undefined"||this.style.opacity==""||this.style.opacity==1.0){
this.style.opacity=value;
}else {
this.style.opacity=1.0;
}
return this;
}
blur(value){
if (value==null){
return this.filter(this.edit_filter_wrapper(this.style.filter,"blur",value));
}else {
return this.filter(this.edit_filter_wrapper(this.style.filter,"blur","blur("+this.pad_numeric(value)+") "));
}
}
toggle_blur(value=10){
return this.filter(this.toggle_filter_wrapper(this.style.filter,"blur","blur("+this.pad_numeric(value)+") "));
}
background_blur(value){
if (value==null){
return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter,"blur",value));
}else {
return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter,"blur","blur("+this.pad_numeric(value)+") "));
}
}
toggle_background_blur(value=10){
return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter,"blur","blur("+this.pad_numeric(value)+") "));
}
brightness(value){
if (value==null){
return this.filter(this.edit_filter_wrapper(this.style.filter,"brightness",value));
}else {
return this.filter(this.edit_filter_wrapper(this.style.filter,"brightness","brightness("+this.pad_percentage(value,"%")+") "));
}
}
toggle_brightness(value=0.5){
return this.filter(this.toggle_filter_wrapper(this.style.filter,"brightness","brightness("+this.pad_percentage(value,"%")+") "));
}
background_brightness(value){
if (value==null){
return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter,"brightness",value));
}else {
return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter,"brightness","brightness("+this.pad_percentage(value,"%")+") "));
}
}
toggle_background_brightness(value=10){
return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter,"brightness","brightness("+this.pad_percentage(value,"%")+") "));
}
rotate(value){
if (value==null){
return this.transform(this.edit_filter_wrapper(this.style.transform,"rotate",value));
}else {
let degree;
if (vweb.utils.is_float(value)){
degree=Math.round(360*value);
}else if (vweb.utils.is_numeric(value)){
degree=value.toString();
}else if (value.charAt(value.length-1)==="%"){
degree=Math.round(360*parseFloat(value.substr(0,value.length-1)/100));
}else {
degree=value;
}
return this.transform(this.edit_filter_wrapper(this.style.transform,"rotate",`rotate(${degree}deg) `));
}
}
delay(value){
this.style.delay=value;
return this;
}
duration(value){
this.style.duration=value;
return this;
}
background(value){
if (value==null){return this.style.background;}
if (typeof value==="string"&&(value.eq_first("linear-gradient")||value.eq_first("radial-gradient"))){
this.style.background=value;
this.style.backgroundImage=value
this.style.backgroundRepeat="no-repeat"
this.style.backgroundSize="cover"
}else {
this.style.background=value;
}
return this;
}
scale_font_size(scale=1.0){
const size=parseFloat(this.style.fontSize)
if (!isNaN(size)){
this.font_size(size*scale);
}
return this;
}
display(value){
if (value==null){
return this.style.display;
}
if (value!=null&&value!="none"){
this.element_display=value;
}
this.style.display=value;
return this;
}
hide(){
this.style.display="none";
return this;
}
show(){
this.style.display=this.element_display;
return this;
}
is_hidden(){
return this.style.display==="none"||typeof this.style.display==="undefined";
}
is_visible(){
return!(this.style.display==="none"||typeof this.style.display==="undefined");
}
toggle_visibility(){
if (this.is_hidden()){
this.show();
}else {
this.hide();
}
return this;
}
inner_html(value){
if (value==null){
return this.innerHTML;
}
this.innerHTML=value;
return this;
}
outer_html(value){
if (value==null){
return this.outerHTML;
}
this.outerHTML=value;
return this;
}
styles(css_attr){
if (css_attr==null){
let dict={};
for (let property in this.style){
let value=this.style[property];
if (
typeof value==='string'&&
value!==undefined&&
value.startsWith("var(")
){
dict[property]=value;
}
else if (
this.style.hasOwnProperty(property)
){
const is_index=(/^\d+$/).test(property);
if (property[0]=="-"&&is_index===false&&value!=''&&typeof value!=='function'){
dict[property]=value;
}
else if (is_index){
const key=this.style[property];
const value=this.style[key];
if (
key!==''&&key!==undefined&&typeof key!=='function'&&
value!==''&&value!==undefined&&typeof value!=='function'
){
dict[key]=value;
}
}
else if (this.element_type==="Style"){
dict[property]=value;
}
}
}
return dict;
}
for (const i in css_attr){
const value=css_attr[i];
if (
i==="display"&&value!=null&&value!=="none"
){
this.element_display=value;
}
this.style[i]=value;
}
return this;
}
attr(key,value=null){
if (value==null){
return this.getAttribute(key);
}
this.setAttribute(key,value);
return this;
}
attrs(html_attr){
for (let i in html_attr){
this.setAttribute(i,html_attr[i]);
}
return this;
}
event(key,value=null){
if (value==null){
return this[key];
}
this[key]=value;
return this;
}
events(html_events){
for (let i in html_events){
this[i]=html_events[i];
}
return this;
}
class(value){
if(value==null){return this.class;}
this.className=value;
return this;
}
toggle_class(name){
this.classList.toggle(name);
return this;
}
remove_class(name){
this.classList.remove(name);
return this;
}
remove_classes(){
while (this.classList.length>0){
this.classList.remove(this.classList.item(0));
}
return this;
}
themes(...themes){
if (themes.length===1&&Array.isArray(themes[0])){
themes=themes[0];
for (let i=0;i<themes.length;i++){
themes[i].element=this;
vweb.themes.theme_elements.push(themes[i]);
}
}else {
for (let i=0;i<themes.length;i++){
themes[i].element=this;
vweb.themes.theme_elements.push(themes[i]);
}
}
return this;
}
hover_brightness(mouse_down_brightness=null,mouse_over_brightness=0.9){
if (mouse_down_brightness===false){
this.onmousedown=null;
this.onmouseover=null;
this.onmouseup=null;
this.onmouseout=null;
return this;
}
if (mouse_down_brightness===true||typeof mouse_down_brightness==="number"){
if (mouse_down_brightness===true){
mouse_down_brightness=0.8;
}
this.onmousedown=function(){this.style.filter=`brightness(${mouse_down_brightness*100}%)`;}
this.onmouseover=function(){this.style.filter=`brightness(${mouse_over_brightness*100}%)`;}
this.onmouseup=function(){this.style.filter="brightness(100%)";}
this.onmouseout=function(){this.style.filter="brightness(100%)";}
return this;
}
else {
return this.onmousedown!=null;
}
}
text_width(text=null){
const width_measurer=document.createElement("canvas").getContext("2d");
const computed=window.getComputedStyle(this);
width_measurer.font=`${computed.fontStyle} ${computed.fontVariant} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
if (text==null){
return width_measurer.measureText(this.textContent).width;
}else {
return width_measurer.measureText(text).width;
}
}
frame_mode(...args){
if (args.length===1){
args[0].push(this);
}else if (args.length===2&&args[0] instanceof FrameModesType){
if (args[1]!==args[0].active){
this.hide();
}
args[0][args[1]].push(this);
}
return this;
}
media(media_query,true_handler,false_handler){
if (media_query.first()!=="("){
media_query="("+media_query;
}
let c;
while ((c=media_query.last())===" "||c==="\t"||c==="\n"){
media_query=media_query.substr(0,media_query.length-1)
}
if (media_query.last()!==")"){
media_query=media_query+")";
}
const e=this;
const query={
list:null,
callback:(query)=>{
if (query.matches){
true_handler(e);
}else if (false_handler!=null){
false_handler(e);
}
}
}
if (this.media_queries===undefined){
this.media_queries={};
}else if (this.media_queries[media_query]!==undefined){
this.media_queries[media_query].list.removeListener(this.media_queries[media_query].callback);
}
query.list=window.matchMedia(media_query);
query.callback(query.list);
query.list.addListener(query.callback);
this.media_queries[media_query]=query;
return this;
}
remove_media(media_query){
if (typeof this.media_queries==="object"&&this.media_queries[media_query]!==undefined){
this.media_queries[media_query].list.removeListener(this.media_queries[media_query].callback);
}
return this;
}
remove_medias(){
if (typeof this.media_queries==="object"){
Object.values(this.media_queries).iterate((query)=>{
query.list.removeListener(query.callback);
})
}
return this;
}
remove_all_media(){
if (typeof this.media_queries==="object"){
Object.values(this.media_queries).iterate((query)=>{
query.list.removeListener(query.callback);
})
}
return this;
}
default_animate(...args){
super.animate(...args);
return this;
}
animate({
keyframes=[],
delay=0,
duration=0,
repeat=false,
persistent=false,
on_finish=null,
easing="ease-in-out",
}){
const e=this;
const convert=[
"width",
"height",
"top",
"right",
"bottom",
"left",
"margin",
"margin-top",
"margin-right",
"margin-bottom",
"margin-left",
"padding",
"padding-top",
"padding-right",
"padding-bottom",
"padding-left",
"border-width",
"border-top-width",
"border-right-width",
"border-bottom-width",
"border-left-width",
"min-width",
"min-height",
"max-width",
"max-height",
"outline-width",
"column-width",
"column-gap",
"row-gap",
"marginTop",
"marginRight",
"marginBottom",
"marginLeft",
"paddingTop",
"paddingRight",
"paddingBottom",
"paddingLeft",
"borderWidth",
"borderTopWidth",
"borderRightWidth",
"borderBottomWidth",
"borderLeftWidth",
"minWidth",
"minHeight",
"maxWidth",
"maxHeight",
"outlineWidth",
"columnWidth",
"columnGap",
"rowGap",
];
for (let i=0;i<keyframes.length;i++){
if (keyframes[i] instanceof StyleElement){
keyframes[i]=keyframes[i].styles();
}else {
for (let key in keyframes[i]){
if (vweb.utils.is_numeric(keyframes[i][key])&&convert.includes(key)){
keyframes[i][key]=this.pad_numeric(keyframes[i][key]);
}
}
}
}
function do_animation(index){
if (index+1<keyframes.length){
const from=keyframes[index];
const to=keyframes[index+1];
let opts={
duration:duration,
};
if (from.duration!=null){
opts.duration=from.duration;
}
if (
(index+2==keyframes.length&&persistent&&!repeat)||
(to.delay!=null&&to.delay>0)
){
opts.fill="forwards";
}
e.default_animate(
[from,to],
opts,
);
if (to.delay!=null&&to.delay>0){
clearTimeout(e.animate_timeout);
e.animate_timeout=setTimeout(()=>do_animation(index+1),(from.duration||duration)+(to.delay||0));
}else {
clearTimeout(e.animate_timeout);
e.animate_timeout=setTimeout(()=>do_animation(index+1),from.duration||duration);
}
}
else if (repeat){
if (delay>0){
clearTimeout(e.animate_timeout);
e.animate_timeout=setTimeout(()=>do_animation(0),delay);
}
else {
const delay=keyframes[keyframes.length-1].duration||duration;
clearTimeout(e.animate_timeout);
e.animate_timeout=setTimeout(()=>do_animation(0),delay);
}
}
else if (on_finish!=null){
on_finish(e);
}
}
clearTimeout(this.animate_timeout);
this.animate_timeout=setTimeout(()=>do_animation(0),delay||0);
return this;
}
stop_animation(){
clearTimeout(this.animate_timeout);
return this;
}
async slide_out({
direction="top",
distance=100,
duration=500,
opacity=true,
easing="ease",
hide=true,
remove=false,
display=null,
_slide_in=false,
}){
const element=this;
return new Promise((resolve,reject)=>{
const old_transform=element.transform()||"";
const old_transition=element.transition();
let transform,initial_transform;
if (_slide_in){
if (direction==="top"){
transform=`translateY(0)`;
initial_transform=`translateY(${-distance}px)`
}else if (direction==="bottom"){
transform=`translateY(0)`;
initial_transform=`translateY(${distance}px)`
}else if (direction==="right"){
transform=`translateX(0)`;
initial_transform=`translateX(${distance}px)`
}else if (direction==="left"){
transform=`translateX(0)`;
initial_transform=`translateX(${-distance}px)`
}else {
return reject(new Error(`Invalid direction "${direction}", the valid directions are "top", "bottom", "right", "left".`));
}
}else {
if (direction==="top"){
transform=`translateY(${-distance}px)`;
initial_transform="translateY(0)";
}else if (direction==="bottom"){
transform=`translateY(${distance}px)`;
initial_transform="translateY(0)";
}else if (direction==="right"){
transform=`translateX(${distance}px)`;
initial_transform="translateX(0)";
}else if (direction==="left"){
transform=`translateX(${-distance}px)`;
initial_transform="translateX(0)";
}else {
return reject(new Error(`Invalid direction "${direction}", the valid directions are "top", "bottom", "right", "left".`));
}
}
initial_transform=old_transform+initial_transform;
transform=old_transform+transform;
if (_slide_in){
if (display!=null){
element.display(display);
}else {
element.show();
}
}
element.transition("none");
element.getBoundingClientRect();
element.transform(initial_transform);
element.opacity(_slide_in?0:1);
element.getBoundingClientRect();
element.transition(`transform ${duration}ms ${easing}, opacity ${duration}ms ease-in`);
element.getBoundingClientRect();
if (opacity===false){
element.transform(transform);
}else {
element.opacity(_slide_in?1:0)
element.transform(transform);
}
setTimeout(()=>{
if (hide&&_slide_in!==true){
element.hide()
}else if (remove&&_slide_in!==true){
element.remove();
}
element.transition(old_transition);
element.transform(old_transform);
resolve()
},duration);
});
}
async slide_in({
direction="top",
distance=100,
duration=500,
opacity=true,
easing="ease",
display=null,
}){
return this.slide_out({
direction:direction,
distance:distance,
duration:duration,
opacity:opacity,
easing:easing,
display:display,
hide:false,
_slide_in:true,
});
}
async dropdown_animation({
distance="-20px",
duration=150,
opacity_duration=1.25,
total_duration=null,
delay=60,
start_delay=50,
easing="ease-in-out",
}={}){
return new Promise((resolve)=>{
const word_spans=[];
const spans=[];
const nodes=this.childNodes;
if (typeof distance==="number"){
distance=`${distance}px`;
}
if (total_duration!=null){
delay=total_duration/this.textContent.length;
}
const split_text=(text,text_style=null)=>{
const words=text.split(" ");
for (let w=0;w<words.length;w++){
const word_span=Span()
.display("inline-block")
.white_space("nowrap")
if (text_style!=null){
word_span.style.cssText=text_style;
}
for (let c=0;c<words[w].length;c++){
const span=Span(words[w][c])
.white_space("pre")
.display("inline-block")
.opacity(0)
.transform(`translateY(${distance})`)
.transition(`transform ${duration}ms ${easing}, opacity ${parseInt(duration*opacity_duration)}ms ${easing}`);
spans.append(span);
word_span.append(span);
}
if (w<words.length-1){
word_span.append(Span(" ").white_space("pre"));
}
word_spans.append(word_span);
}
}
const traverse=(nodes,text_style="")=>{
for (let n=0;n<nodes.length;n++){
const node=nodes[n];
if (node.nodeType===Node.TEXT_NODE){
split_text(node.textContent,text_style)
}else {
traverse(node.childNodes,text_style+node.style.cssText);
}
}
}
traverse(nodes);
this.innerHTML="";
for (let i=0;i<word_spans.length;i++){
this.append(word_spans[i]);
}
let index=0;
const animate_span=()=>{
spans[index].opacity(1);
spans[index].transform("translateY(0px)");
++index;
if (index===spans.length){
resolve();
}else {
setTimeout(animate_span,delay);
}
}
setTimeout(animate_span,start_delay);
})
}
async increment_number_animation({
start=0,
end=100,
duration=150,
total_duration=null,
delay=0,
prefix="",
suffix="",
}={}){
if (total_duration!=null){
duration=total_duration/this.textContent.length;
}
return new Promise((resolve)=>{
let value=start;
const animate=()=>{
this.textContent=`${prefix}${value}${suffix}`;
++value;
if (value<end){
setTimeout(animate,duration);
}else {
resolve();
}
}
setTimeout(animate,delay);
})
}
on_event(id,callback){
vweb.events.on(id, this,callback);
return this;
}
remove_on_event(id,callback){
vweb.events.remove(id, this,callback);
return this;
}
remove_on_events(id){
vweb.events.remove(id, this);
return this;
}
timeout(delay,callback,options=null){
if (options!=null&&options.id!=null){
if (this._timeouts===undefined){
this._timeouts={};
}
if (options.debounce===true){
clearTimeout(this._timeouts[options.id]);
}
this._timeouts[options.id]=setTimeout(()=>callback(this),delay);
}else {
setTimeout(()=>callback(this),delay);
}
return this;
}
clear_timeout(id){
if (this._timeouts===undefined){
this._timeouts={};
}
clearTimeout(this._timeouts[id]);
return this;
}
disable(){
this._disabled=true;
return this;
}
enable(){
this._disabled=false;
return this;
}
on_click(...args){
let simulate_href,callback;
if (args.length===0){
return this.onclick;
}else if (args.length===1){
callback=args[0];
}else if (args.length===2&&args[0]==null){
callback=args[1];
}else {
simulate_href=args[0];
callback=args[1];
this.href(simulate_href);
}
if (callback==null){
return this.onclick;
}
this.style.cursor="pointer";
this.user_select("none");
const e=this;
this.onclick=(t)=>{
if (simulate_href){
event.preventDefault();
}
if (this._disabled!==true){
callback(e,t);
}
};
return this;
}
on_click_redirect(url){
return this.on_click(url,()=>vweb.utils.redirect(url));
}
on_scroll(opts_or_callback={callback:null,delay:null}){
if (opts_or_callback==null){return this.onscroll;}
if (vweb.utils.is_func(opts_or_callback)){
const e=this;
this.onscroll=(event)=>opts_or_callback(e,event);
}else {
if (opts_or_callback.delay==null){
this.onscroll=opts_or_callback.callback;
}else {
let timer;
const e=this;
this.onscroll=function(t){
clearTimeout(timer);
setTimeout(()=>opts_or_callback.callback(e,t),opts_or_callback.delay);
}
}
}
return this;
}
on_window_resize({callback,once=false,delay=25}){
if (callback==null){return window.onresize;}
const e=this;
window.addEventListener('resize',()=>{
if (once&&e.on_window_resize_timer!=null){
clearTimeout(e.on_window_resize_timer)
}
e.on_window_resize_timer=setTimeout(()=>callback(e),delay);
});
return this;
}
on_attachment_drop({callback,read=true,compress=false,on_start=()=>{}}){
this.ondragover=(event)=>{
event.preventDefault();
event.dataTransfer.dropEffect="copy";
on_start(event);
};
this.ondrop=(event)=>{
event.preventDefault();
const items=event.dataTransfer.items;
for (let i=0;i<items.length;i++){
const item=items[i];
if (item.kind==='file'){
const file=item.getAsFile();
if (file){
const args={
name:file.name,
path:file.path,
is_dir:false,
data:null,
compressed:false,
file:file,
size:file.size/(1024*1024),
};
if (item.webkitGetAsEntry){
const entry=item.webkitGetAsEntry();
if (entry&&entry.isDirectory){
args.is_dir=true;
}
}
if (args.is_dir===false&&read){
const reader=new FileReader();
reader.onload=(event)=>{
if (compress){
args.data=vweb.utils.compress(event.target.result);
args.compressed=true;
}else {
args.data=event.target.result;
args.compressed=false;
}
callback(args);
};
reader.readAsText(file);
}else {
callback(args);
}
}
}
}
}
return this;
}
on_appear(callback_or_opts={callback:null,repeat:false,threshold:null}){
let callback=callback_or_opts,repeat=false,threshold=null;
if (typeof callback_or_opts==="object"){
callback=callback_or_opts.callback;
if (callback_or_opts.repeat!==undefined){repeat=callback_or_opts.repeat;}
if (callback_or_opts.threshold!==undefined){threshold=callback_or_opts.threshold;}
}
const observer=new IntersectionObserver((entries)=>{
entries.forEach(async (entry)=>{
const element=entry.target;
const currentY=entry.boundingClientRect.top;
const previousY=element._previousY!==undefined?element._previousY:currentY;
const is_scrolling_down=currentY<=previousY;
const scroll_direction=is_scrolling_down?'down':'up';
element._previousY=currentY;
if (entry.isIntersecting&&Array.isArray(element._on_appear_callbacks)){
const intersection_ratio=entry.intersectionRatio;
let found;
for (let i=0;i<element._on_appear_callbacks.length;i++){
if (element._on_appear_callbacks[i].callback===callback){
found=true;
break;
}
}
if (!found){
observer.unobserve(element);
return ;
}
let matched=false;
if (
(threshold==null||intersection_ratio>=threshold)
){
matched=true;
callback(element,{scroll_direction});
}
if (matched===false){
observer.unobserve(element);
observer.observe(element);
}
else if (repeat===false){
observer.unobserve(element);
observer.disconnect();
}
}
});
});
if (Array.isArray(this._on_appear_callbacks)){
this._on_appear_callbacks.push({callback,threshold,repeat});
}else {
this._on_appear_callbacks=[{callback,threshold,repeat}];
}
observer.observe(this);
return this;
}
on_disappear(callback_or_opts={callback:null,repeat:false}){
const element=this;
let callback=callback_or_opts;
let repeat=false;
if (typeof callback_or_opts==='object'){
callback=callback_or_opts.callback;
if (callback_or_opts.repeat!==undefined)repeat=callback_or_opts.repeat;
if (callback_or_opts.threshold!==undefined){
console.error(`Invalid parameter "threshold".`);
}
}
element._on_disappear_is_visible=false;
const observer=new IntersectionObserver((entries,observer)=>{
entries.forEach((entry)=>{
if (entry.isIntersecting){
element._on_disappear_is_visible=true;
}
else if (element._on_disappear_is_visible&&!entry.isIntersecting){
element._on_disappear_is_visible=false;
callback(element);
if (!repeat){
observer.unobserve(element);
}
}
});
});
observer.observe(element);
return this;
}
on_enter(callback){
this._on_enter_callback=callback;
if (this._on_keypress_set!==true){
this._on_keypress_set=true;
const e=this;
super.onkeypress=function(event){
if (this._on_enter_callback!==undefined&&event.key==="Enter"&&event.shiftKey===false){
this._on_enter_callback(e,event);
}else if (this._on_escape_callback!==undefined&&event.key==="Escape"){
this._on_escape_callback(e,event);
}
}
}
return this;
}
on_escape(callback){
this._on_escape_callback=callback;
if (this._on_keypress_set!==true){
this._on_keypress_set=true;
const e=this;
super.onkeypress=function(event){
if (this._on_enter_callback!==undefined&&event.key==="Enter"&&event.shiftKey===false){
this._on_enter_callback(e,event);
}else if (this._on_escape_callback!==undefined&&event.key==="Escape"){
this._on_escape_callback(e,event);
}
}
}
return this;
}
on_theme_update(callback){
if (callback==null){
return this._on_theme_updates;
}
const found=vweb.themes.theme_elements.iterate((item)=>{
if (item.element===this){
return true;
}
})
if (found!==true){
vweb.themes.theme_elements.push({
element:this,
is_empty_theme:true,
});
}
if (Array.isArray(this._on_theme_updates)){
this._on_theme_updates.push(callback)
}else {
this._on_theme_updates=[callback];
}
return this;
}
remove_on_theme_update(callback){
if (Array.isArray(this._on_theme_updates)){
this._on_theme_updates=this._on_theme_updates.drop(callback);
}
return this;
}
remove_on_theme_updates(){
if (Array.isArray(this._on_theme_updates)){
this._on_theme_updates=[];
}
return this;
}
on_render(callback){
if (callback==null){
return this._on_render_callbacks;
}
if (Array.isArray(this._on_render_callbacks)){
this._on_render_callbacks.push(callback);
}else {
this.rendered=false;
this._on_render_callbacks=[callback];
if (!this._observing_on_render){
this._observing_on_render=true;
vweb.utils.on_render_observer.observe(this);
}
}
return this;
}
remove_on_render(callback){
if (Array.isArray(this._on_render_callbacks)){
this._on_render_callbacks=this._on_render_callbacks.drop(callback);
if (this._on_render_callbacks.length===0){
vweb.utils.on_render_observer.unobserve(this);
this._observing_on_render=false;
}
}
return this;
}
remove_on_renders(){
if (Array.isArray(this._on_render_callbacks)){
this._on_render_callbacks=[];
vweb.utils.on_render_observer.unobserve(this);
this._observing_on_render=false;
}
return this;
}
is_rendered(){
return this.rendered;
}
on_load(callback){
vweb.events.on("vweb.on_load", this,callback);
return this;
}
remove_on_load(callback){
vweb.events.remove("vweb.on_load", this,callback);
return this;
}
remove_on_loads(){
vweb.events.remove("vweb.on_load", this);
return this;
}
on_resize(callback){
if (callback==null){
return this._on_resize_callbacks;
}
if (Array.isArray(this._on_resize_callbacks)){
this._on_resize_callbacks.push(callback);
}else {
this._on_resize_callbacks=[callback];
if (!this._observing_on_resize){
this._observing_on_resize=true;
vweb.utils.on_resize_observer.observe(this);
}
}
return this;
}
remove_on_resize(callback){
if (Array.isArray(this._on_resize_callbacks)){
this._on_resize_callbacks=this._on_resize_callbacks.drop(callback);
if (this._on_resize_callbacks.length===0){
vweb.utils.on_resize_observer.unobserve(this);
this._observing_on_resize=false;
}
}
return this;
}
remove_on_resizes(callback){
if (Array.isArray(this._on_resize_callbacks)){
this._on_resize_callbacks=[];
vweb.utils.on_resize_observer.unobserve(this);
this._observing_on_resize=false;
}
return this;
}
on_resize_rule(evaluation,on_true,on_false){
if (this._on_resize_rule_evals===undefined){
this._on_resize_rule_evals=[];
}
const eval_index=this._on_resize_rule_evals.length;
this._on_resize_rule_evals[eval_index]=null;
this.on_resize(()=>{
const result=evaluation(this);
if (result!==this._on_resize_rule_evals[eval_index]){
this._on_resize_rule_evals[eval_index]=result;
if (result&&on_true){
on_true(this);
}else if (!result&&on_false){
on_false(this);
}
}
})
return this;
}
on_shortcut(shortcuts=[]){
const is_match=(key,event,shortcut)=>{
if (typeof shortcut.match==="function"){
return shortcut.match(event,key,shortcut);
}
else if (shortcut.key!==undefined){
if (key!==shortcut.key){
return false;
}
}
else if (shortcut.keys!==undefined){
const keys=shortcut.keys;
const or=shortcut.or===undefined?true :shortcut.or;
if (or){
let found=false;
for (let i=0;i<keys.length;i++){
if (keys[i]===key){
found=true;
break;
}
}
if (found===false){return false;}
}else {
const duration=shortcut.duration||150;
if (
this._on_shortcut_time===null||
Date.now()-this._on_shortcut_time>duration
){
return false;
}
if (!(
(this.on_shortcut_key===keys[0]&&key===keys[1])||
(this.on_shortcut_key===keys[1]&&key===keys[0])
)){
return false;
}
}
}
else if (shortcut.keycode!==undefined){
if (event.keyCode!==shortcut.keycode){
return false;
}
}
else if (shortcut.keycodes!==undefined){
const keys=shortcut.keycodes;
const or=shortcut.or===undefined?true :shortcut.or;
if (or){
let found=false;
for (let i=0;i<keys.length;i++){
if (keys[i]===event.keyCode){
found=true;
break;
}
}
if (found===false){return false;}
}else {
const duration=shortcut.duration||150;
if (
this._on_shortcut_time===null||
Date.now()-this._on_shortcut_time>duration
){
return false;
}
if (!(
this.on_shortcut_keycode===keys[0]&&event.keyCode===keys[1]||
this.on_shortcut_keycode===keys[1]&&event.keyCode===keys[0]
)){
return false;
}
}
}
else {
console.error("At least one of the following shortcut attributes must be defined: [key, keys, keycode, keycodes].");
return false;
}
const allow_other_modifiers=shortcut.allow_other_modifiers===undefined?false :shortcut.allow_other_modifiers;
const shift=shortcut.shift===undefined?false :shortcut.shift;
const alt=shortcut.alt===undefined?false :shortcut.alt;
const ctrl=shortcut.ctrl===undefined?false :shortcut.ctrl;
if (event.shiftKey!==shift&&(shift||allow_other_modifiers===false)){
return false;
}
if (event.altKey!==alt&&(alt||allow_other_modifiers===false)){
return false;
}
if ((event.ctrlKey||event.metaKey)!==ctrl&&(ctrl||allow_other_modifiers===false)){
return false;
}
return true;
}
if (this.hasAttribute("tabindex")===false){
this.setAttribute("tabindex","0");
this.outline("none");
this.border("none");
}
this.onkeydown=(event)=>{
const key=event.key.toLowerCase();
const matched=shortcuts.iterate((shortcut)=>{
if (is_match(key,event,shortcut)){
shortcut.callback(this,event);
return true;
}
});
if (matched!==true){
this.on_shortcut_time=Date.now();
this.on_shortcut_key=event.key;
this.on_shortcut_keycode=event.keyCode;
}
}
}
on_context_menu(callback){
if (callback==null){
if (this._context_menu!==undefined){
return this._context_menu;
}else {
return this.oncontextmenu;
}
}
if (callback instanceof ContextMenuElement||callback.element_type==="ContextMenu"){
this._context_menu=callback;
const _this_=this;
this.oncontextmenu=(event)=>{
this._context_menu.popup(event);
};
}else if (Array.isArray(callback)){
this._context_menu=callback;
const _this_=this;
this.oncontextmenu=(event)=>{
ContextMenu(callback).popup(event);
};
}else {
const _this_=this;
this.oncontextmenu=(event)=>callback(_this_,event);
}
return this;
}
on_mouse_enter(callback){
if (callback==null){return this._on_mouse_enter_callback;}
this._on_mouse_enter_callback=callback;
const e=this;
this.addEventListener("mouseenter",(t)=>callback(e,t))
return this;
}
on_mouse_leave(callback){
if (callback==null){return this._on_mouse_leave_callback;}
this._on_mouse_leave_callback=callback;
const e=this;
this.addEventListener("mouseleave",(t)=>callback(e,t))
return this;
}
on_mouse_over_out(mouse_over,mouse_out){
this.on_mouse_over(mouse_over);
this.on_mouse_out(mouse_out);
return this;
}
first_child(){
return this.firstChild;
}
last_child(){
return this.lastChild;
}
iterate(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.children.length;
}
for (let i=start;i<end;i++){
const res=handler(this.children[i],i);
if (res!=null){
return res;
}
}
return null;
};
iterate_nodes(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.childNodes.length;
}
for (let i=start;i<end;i++){
const res=handler(this.childNodes[i],i);
if (res!=null){
return res;
}
}
return null;
};
set_default(Type){
if (Type==null){
Type=Element;
}
Type.default_style=this.styles();
return this;
}
assign(name,value){
this[name]=value;
return this;
}
extend(obj){
for (let name in obj){
this.assign(name,obj[name]);
}
return this;
}
select(overwrite=true){
if (super.select!=undefined){
super.select();
return this;
}
this.focus();
const range=document.createRange();
range.selectNodeContents(this);
const selection=window.getSelection();
if (overwrite){
selection.removeAllRanges();
}
selection.addRange(range);
return this;
}
focusable(value){
if (value==null){
return this.getAttribute("tabindex")!=="-1";
}else if (value===true){
this.setAttribute('tabindex','-1');
this.style.outline="none";
}else {
this.setAttribute('tabindex','-1');
this.style.outline="none";
}
return this;
}
alt(value){
if (value==null){return this.getAttribute("alt");}
this.setAttribute("alt",value)
return this;
}
is_scrollable(){
return this.scrollHeight>this.clientHeight||this.scrollWidth>this.clientWidth;
}
is_scrollable_x(){
return this.scrollWidth>this.clientWidth;
}
is_scrollable_y(){
return this.scrollHeight>this.clientHeight;
}
async wait_till_children_rendered(timeout=10000){
return new Promise((resolve,reject)=>{
let elapsed=0;
let step=25;
let nodes=[];
const map_nodes=(node)=>{
nodes.append(node);
for (let i=0;i<node.children.length;i++){
map_nodes(node.children[i]);
}
}
map_nodes(this);
console.log(nodes);
const wait=()=>{
const rendered=nodes.iterate(node=>{
if (!node._is_connected){
return false;
}
console.log(node._is_connected);
})
if (rendered!==false){
console.log("resolve",rendered);
resolve();
}else {
if (elapsed>timeout){
return reject(new Error("Timeout error."));
}
elapsed+=step;
setTimeout(wait,step);
}
}
wait();
})
}
pseudo(type,node){
if (node.pseudo_id===undefined){
node.pseudo_id="pseudo_"+String.random(24);
}
if (node.style.content==null){
node.style.content="";
}
if (node.added_to_elements===undefined){
node.added_to_elements=[];
}
const alread_added=node.added_to_elements.iterate((item)=>{
if (item.node===this&&item.type===type){
return true;
}
})
if (alread_added!==true){
node.added_to_elements.append({
node:this,
type:type,
})
}
if (this.pseudo_stylesheets===undefined){
this.pseudo_stylesheets={};
}
const css=`.${node.pseudo_id}::${type}{${node.style.cssText};content:"";}`
if (this.pseudo_stylesheets[node.pseudo_id]===undefined){
const style=document.createElement('style');
style.type='text/css';
document.head.appendChild(style);
style.sheet.insertRule(css,0);
this.pseudo_stylesheets[node.pseudo_id]=style;
}else {
const style=this.pseudo_stylesheets[node.pseudo_id];
style.sheet.deleteRule(0);
style.sheet.insertRule(css,0);
}
this.classList.add(node.pseudo_id);
return this;
}
remove_pseudo(node){
if (node&&node.pseudo_id){
this.classList.remove(node.pseudo_id);
}
this.pseudo_stylesheets[node.pseudo_id].remove();
delete this.pseudo_stylesheets[node.pseudo_id];
return this;
}
remove_pseudos(){
this.classList.forEach(name=>{
if (name.startsWith("pseudo_")){
this.classList.remove(name);
}
})
Object.values(this.pseudo_stylesheets).iterate(stylesheet=>{stylesheet.remove();})
this.pseudo_stylesheets={};
return this;
}
pseudo_on_hover(type,node,set_defaults=true){
if (set_defaults){
node.position(0,0,0,0);
const border_radius=this.border_radius();
if (border_radius){
node.border_radius(border_radius);
}
this.position("relative")
}
this.on_mouse_over(()=>this.pseudo("after",node))
this.on_mouse_out(()=>this.remove_pseudo(node))
return this;
}
parent(value){
if (value==null){
if (this._parent==null||this._parent===undefined){
return this.parentElement;
}
return this._parent;
}
this._parent=value;
return this;
}
abs_parent(value){
if (value==null){
return this._abs_parent;
}
this._abs_parent=value;
return this;
}
assign_to_parent_as(name){
this._assign_to_parent_as=name;
return this;
}
get_y_offset_from_parent(parent){
let offset=0;
let node=this;
const parentRect=parent.getBoundingClientRect();
while (node&&node!==parent&&node!==document.body){
const nodeRect=node.getBoundingClientRect();
offset+=nodeRect.top-parentRect.top;
node=node.parentElement;
}
if (node===parent){
return offset;
}
return null;
}
absolute_y_offset(){
let element=this;
let top=0;
do {
top+=element.offsetTop||0;
element=element.offsetParent;
}while(element);
return top;
}
absolute_x_offset(){
let element=this;
let left=0;
do {
left+=element.offsetLeft||0;
element=element.offsetParent;
}while(element);
return left;
}
exec(callback){
callback(this);
return this;
}
is_child(target){
return vweb.utils.is_child(this,target);
}
is_nested_child(target,stop_node=null){
return vweb.utils.is_nested_child(this,target,stop_node);
}
toString(){
this.setAttribute("created_by_html","true");
return this.outerHTML;
}
readonly(value){
if (value==null){return super.readOnly;}
if (!value){
super.removeAttribute("readOnly");
}else {
super.readOnly=value;
}
return this;
}
download(value){
if (value==null){return super.download;}
if (!value){
super.removeAttribute("download");
}else {
super.download=value;
}
return this;
}
accent_color(value){
if (value==null){return this.style.accentColor;}
this.style.accentColor=value;
return this;
}
align_content(value){
if (value==null){return this.style.alignContent;}
this.style.alignContent=value;
this.style.msAlignContent=value;
this.style.webkitAlignContent=value;
this.style.MozAlignContent=value;
this.style.OAlignContent=value;
return this;
}
align_items(value){
if (value==null){return this.style.alignItems;}
this.style.alignItems=value;
this.style.msAlignItems=value;
this.style.webkitAlignItems=value;
this.style.MozAlignItems=value;
this.style.OAlignItems=value;
return this;
}
align_self(value){
if (value==null){return this.style.alignSelf;}
this.style.alignSelf=value;
this.style.msAlignSelf=value;
this.style.webkitAlignSelf=value;
this.style.MozAlignSelf=value;
this.style.OAlignSelf=value;
return this;
}
all(value){
if (value==null){return this.style.all;}
this.style.all=value;
return this;
}
animation(value){
if (value==null){return this.style.animation;}
this.style.animation=value;
this.style.msAnimation=value;
this.style.webkitAnimation=value;
this.style.MozAnimation=value;
this.style.OAnimation=value;
return this;
}
animation_delay(value){
if (value==null){return this.style.animationDelay;}
this.style.animationDelay=value;
this.style.msAnimationDelay=value;
this.style.webkitAnimationDelay=value;
this.style.MozAnimationDelay=value;
this.style.OAnimationDelay=value;
return this;
}
animation_direction(value){
if (value==null){return this.style.animationDirection;}
this.style.animationDirection=value;
this.style.msAnimationDirection=value;
this.style.webkitAnimationDirection=value;
this.style.MozAnimationDirection=value;
this.style.OAnimationDirection=value;
return this;
}
animation_duration(value){
if (value==null){return this.style.animationDuration;}
this.style.animationDuration=value;
this.style.msAnimationDuration=value;
this.style.webkitAnimationDuration=value;
this.style.MozAnimationDuration=value;
this.style.OAnimationDuration=value;
return this;
}
animation_fill_mode(value){
if (value==null){return this.style.animationFillMode;}
this.style.animationFillMode=value;
this.style.msAnimationFillMode=value;
this.style.webkitAnimationFillMode=value;
this.style.MozAnimationFillMode=value;
this.style.OAnimationFillMode=value;
return this;
}
animation_iteration_count(value){
if (value==null){return this.style.animationIterationCount;}
this.style.animationIterationCount=value;
this.style.msAnimationIterationCount=value;
this.style.webkitAnimationIterationCount=value;
this.style.MozAnimationIterationCount=value;
this.style.OAnimationIterationCount=value;
return this;
}
animation_name(value){
if (value==null){return this.style.animationName;}
this.style.animationName=value;
this.style.msAnimationName=value;
this.style.webkitAnimationName=value;
this.style.MozAnimationName=value;
this.style.OAnimationName=value;
return this;
}
animation_play_state(value){
if (value==null){return this.style.animationPlayState;}
this.style.animationPlayState=value;
this.style.msAnimationPlayState=value;
this.style.webkitAnimationPlayState=value;
this.style.MozAnimationPlayState=value;
this.style.OAnimationPlayState=value;
return this;
}
animation_timing_function(value){
if (value==null){return this.style.animationTimingFunction;}
this.style.animationTimingFunction=value;
this.style.msAnimationTimingFunction=value;
this.style.webkitAnimationTimingFunction=value;
this.style.MozAnimationTimingFunction=value;
this.style.OAnimationTimingFunction=value;
return this;
}
aspect_ratio(value){
if (value==null){return this.style.aspectRatio;}
this.style.aspectRatio=value;
return this;
}
backdrop_filter(value){
if (value==null){return this.style.backdropFilter;}
this.style.backdropFilter=value;
this.style.msBackdropFilter=value;
this.style.webkitBackdropFilter=value;
this.style.MozBackdropFilter=value;
this.style.OBackdropFilter=value;
return this;
}
backface_visibility(value){
if (value==null){return this.style.backfaceVisibility;}
this.style.backfaceVisibility=value;
this.style.msBackfaceVisibility=value;
this.style.webkitBackfaceVisibility=value;
this.style.MozBackfaceVisibility=value;
this.style.OBackfaceVisibility=value;
return this;
}
background_attachment(value){
if (value==null){return this.style.backgroundAttachment;}
this.style.backgroundAttachment=value;
return this;
}
background_blend_mode(value){
if (value==null){return this.style.backgroundBlendMode;}
this.style.backgroundBlendMode=value;
return this;
}
background_clip(value){
if (value==null){return this.style.backgroundClip;}
this.style.backgroundClip=value;
this.style.msBackgroundClip=value;
this.style.webkitBackgroundClip=value;
this.style.MozBackgroundClip=value;
this.style.OBackgroundClip=value;
return this;
}
background_color(value){
if (value==null){return this.style.backgroundColor;}
this.style.backgroundColor=value;
return this;
}
background_image(value){
if (value==null){return this.style.backgroundImage;}
this.style.backgroundImage=value;
return this;
}
background_origin(value){
if (value==null){return this.style.backgroundOrigin;}
this.style.backgroundOrigin=value;
this.style.msBackgroundOrigin=value;
this.style.webkitBackgroundOrigin=value;
this.style.MozBackgroundOrigin=value;
this.style.OBackgroundOrigin=value;
return this;
}
background_position(value){
if (value==null){return this.style.backgroundPosition;}
this.style.backgroundPosition=value;
return this;
}
background_position_x(value){
if (value==null){return this.style.backgroundPositionX;}
this.style.backgroundPositionX=value;
return this;
}
background_position_y(value){
if (value==null){return this.style.backgroundPositionY;}
this.style.backgroundPositionY=value;
return this;
}
background_repeat(value){
if (value==null){return this.style.backgroundRepeat;}
this.style.backgroundRepeat=value;
return this;
}
background_size(value){
if (value==null){return this.style.backgroundSize;}
this.style.backgroundSize=this.pad_numeric(value);
this.style.msBackgroundSize=this.pad_numeric(value);
this.style.webkitBackgroundSize=this.pad_numeric(value);
this.style.MozBackgroundSize=this.pad_numeric(value);
this.style.OBackgroundSize=this.pad_numeric(value);
return this;
}
block_size(value){
if (value==null){return this.style.blockSize;}
this.style.blockSize=this.pad_numeric(value);
return this;
}
border_block(value){
if (value==null){return this.style.borderBlock;}
this.style.borderBlock=value;
return this;
}
border_block_color(value){
if (value==null){return this.style.borderBlockColor;}
this.style.borderBlockColor=value;
return this;
}
border_block_end_color(value){
if (value==null){return this.style.borderBlockEndColor;}
this.style.borderBlockEndColor=value;
return this;
}
border_block_end_style(value){
if (value==null){return this.style.borderBlockEndStyle;}
this.style.borderBlockEndStyle=value;
return this;
}
border_block_end_width(value){
if (value==null){return this.style.borderBlockEndWidth;}
this.style.borderBlockEndWidth=this.pad_numeric(value);
return this;
}
border_block_start_color(value){
if (value==null){return this.style.borderBlockStartColor;}
this.style.borderBlockStartColor=value;
return this;
}
border_block_start_style(value){
if (value==null){return this.style.borderBlockStartStyle;}
this.style.borderBlockStartStyle=value;
return this;
}
border_block_start_width(value){
if (value==null){return this.style.borderBlockStartWidth;}
this.style.borderBlockStartWidth=this.pad_numeric(value);
return this;
}
border_block_style(value){
if (value==null){return this.style.borderBlockStyle;}
this.style.borderBlockStyle=value;
return this;
}
border_block_width(value){
if (value==null){return this.style.borderBlockWidth;}
this.style.borderBlockWidth=this.pad_numeric(value);
return this;
}
border_bottom_color(value){
if (value==null){return this.style.borderBottomColor;}
this.style.borderBottomColor=value;
return this;
}
border_bottom_left_radius(value){
if (value==null){return this.style.borderBottomLeftRadius;}
this.style.borderBottomLeftRadius=this.pad_numeric(value);
return this;
}
border_bottom_right_radius(value){
if (value==null){return this.style.borderBottomRightRadius;}
this.style.borderBottomRightRadius=this.pad_numeric(value);
return this;
}
border_bottom_style(value){
if (value==null){return this.style.borderBottomStyle;}
this.style.borderBottomStyle=value;
return this;
}
border_bottom_width(value){
if (value==null){return this.style.borderBottomWidth;}
this.style.borderBottomWidth=this.pad_numeric(value);
return this;
}
border_collapse(value){
if (value==null){return this.style.borderCollapse;}
this.style.borderCollapse=value;
return this;
}
border_color(value){
if (value==null){return this.style.borderColor;}
this.style.borderColor=value;
return this;
}
border_image(value){
if (value==null){return this.style.borderImage;}
this.style.borderImage=value;
this.style.msBorderImage=value;
this.style.webkitBorderImage=value;
this.style.MozBorderImage=value;
this.style.OBorderImage=value;
return this;
}
border_image_outset(value){
if (value==null){return this.style.borderImageOutset;}
this.style.borderImageOutset=value;
return this;
}
border_image_repeat(value){
if (value==null){return this.style.borderImageRepeat;}
this.style.borderImageRepeat=value;
return this;
}
border_image_slice(value){
if (value==null){return this.style.borderImageSlice;}
this.style.borderImageSlice=value;
return this;
}
border_image_source(value){
if (value==null){return this.style.borderImageSource;}
this.style.borderImageSource=value;
return this;
}
border_image_width(value){
if (value==null){return this.style.borderImageWidth;}
this.style.borderImageWidth=this.pad_numeric(value);
return this;
}
border_inline(value){
if (value==null){return this.style.borderInline;}
this.style.borderInline=value;
return this;
}
border_inline_color(value){
if (value==null){return this.style.borderInlineColor;}
this.style.borderInlineColor=value;
return this;
}
border_inline_end_color(value){
if (value==null){return this.style.borderInlineEndColor;}
this.style.borderInlineEndColor=value;
return this;
}
border_inline_end_style(value){
if (value==null){return this.style.borderInlineEndStyle;}
this.style.borderInlineEndStyle=value;
return this;
}
border_inline_end_width(value){
if (value==null){return this.style.borderInlineEndWidth;}
this.style.borderInlineEndWidth=this.pad_numeric(value);
return this;
}
border_inline_start_color(value){
if (value==null){return this.style.borderInlineStartColor;}
this.style.borderInlineStartColor=value;
return this;
}
border_inline_start_style(value){
if (value==null){return this.style.borderInlineStartStyle;}
this.style.borderInlineStartStyle=value;
return this;
}
border_inline_start_width(value){
if (value==null){return this.style.borderInlineStartWidth;}
this.style.borderInlineStartWidth=this.pad_numeric(value);
return this;
}
border_inline_style(value){
if (value==null){return this.style.borderInlineStyle;}
this.style.borderInlineStyle=value;
return this;
}
border_inline_width(value){
if (value==null){return this.style.borderInlineWidth;}
this.style.borderInlineWidth=this.pad_numeric(value);
return this;
}
border_left_color(value){
if (value==null){return this.style.borderLeftColor;}
this.style.borderLeftColor=value;
return this;
}
border_left_style(value){
if (value==null){return this.style.borderLeftStyle;}
this.style.borderLeftStyle=value;
return this;
}
border_left_width(value){
if (value==null){return this.style.borderLeftWidth;}
this.style.borderLeftWidth=this.pad_numeric(value);
return this;
}
border_radius(value){
if (value==null){return this.style.borderRadius;}
this.style.borderRadius=this.pad_numeric(value);
this.style.msBorderRadius=this.pad_numeric(value);
this.style.webkitBorderRadius=this.pad_numeric(value);
this.style.MozBorderRadius=this.pad_numeric(value);
this.style.OBorderRadius=this.pad_numeric(value);
return this;
}
border_right_color(value){
if (value==null){return this.style.borderRightColor;}
this.style.borderRightColor=value;
return this;
}
border_right_style(value){
if (value==null){return this.style.borderRightStyle;}
this.style.borderRightStyle=value;
return this;
}
border_right_width(value){
if (value==null){return this.style.borderRightWidth;}
this.style.borderRightWidth=this.pad_numeric(value);
return this;
}
border_spacing(value){
if (value==null){return this.style.borderSpacing;}
this.style.borderSpacing=value;
return this;
}
border_style(value){
if (value==null){return this.style.borderStyle;}
this.style.borderStyle=value;
return this;
}
border_top_color(value){
if (value==null){return this.style.borderTopColor;}
this.style.borderTopColor=value;
return this;
}
border_top_left_radius(value){
if (value==null){return this.style.borderTopLeftRadius;}
this.style.borderTopLeftRadius=this.pad_numeric(value);
return this;
}
border_top_right_radius(value){
if (value==null){return this.style.borderTopRightRadius;}
this.style.borderTopRightRadius=this.pad_numeric(value);
return this;
}
border_top_style(value){
if (value==null){return this.style.borderTopStyle;}
this.style.borderTopStyle=value;
return this;
}
border_top_width(value){
if (value==null){return this.style.borderTopWidth;}
this.style.borderTopWidth=this.pad_numeric(value);
return this;
}
border_width(value){
if (value==null){return this.style.borderWidth;}
this.style.borderWidth=this.pad_numeric(value);
return this;
}
bottom(value){
if (value==null){return this.style.bottom;}
this.style.bottom=this.pad_numeric(value);
return this;
}
box_decoration_break(value){
if (value==null){return this.style.boxDecorationBreak;}
this.style.boxDecorationBreak=value;
return this;
}
box_reflect(value){
if (value==null){return this.style.boxReflect;}
this.style.boxReflect=value;
return this;
}
box_shadow(value){
if (value==null){return this.style.boxShadow;}
this.style.boxShadow=value;
this.style.msBoxShadow=value;
this.style.webkitBoxShadow=value;
this.style.MozBoxShadow=value;
this.style.OBoxShadow=value;
return this;
}
box_sizing(value){
if (value==null){return this.style.boxSizing;}
this.style.boxSizing=value;
this.style.msBoxSizing=value;
this.style.webkitBoxSizing=value;
this.style.MozBoxSizing=value;
this.style.OBoxSizing=value;
return this;
}
break_after(value){
if (value==null){return this.style.breakAfter;}
this.style.breakAfter=value;
return this;
}
break_before(value){
if (value==null){return this.style.breakBefore;}
this.style.breakBefore=value;
return this;
}
break_inside(value){
if (value==null){return this.style.breakInside;}
this.style.breakInside=value;
return this;
}
caption_side(value){
if (value==null){return this.style.captionSide;}
this.style.captionSide=value;
return this;
}
caret_color(value){
if (value==null){return this.style.caretColor;}
this.style.caretColor=value;
return this;
}
clear(value){
if (value==null){return this.style.clear;}
this.style.clear=value;
return this;
}
clip(value){
if (value==null){return this.style.clip;}
this.style.clip=value;
return this;
}
column_count(value){
if (value==null){return this.style.columnCount;}
this.style.columnCount=value;
this.style.msColumnCount=value;
this.style.webkitColumnCount=value;
this.style.MozColumnCount=value;
this.style.OColumnCount=value;
return this;
}
column_fill(value){
if (value==null){return this.style.columnFill;}
this.style.columnFill=value;
return this;
}
column_gap(value){
if (value==null){return this.style.columnGap;}
this.style.columnGap=value;
this.style.msColumnGap=value;
this.style.webkitColumnGap=value;
this.style.MozColumnGap=value;
this.style.OColumnGap=value;
return this;
}
column_rule(value){
if (value==null){return this.style.columnRule;}
this.style.columnRule=value;
this.style.msColumnRule=value;
this.style.webkitColumnRule=value;
this.style.MozColumnRule=value;
this.style.OColumnRule=value;
return this;
}
column_rule_color(value){
if (value==null){return this.style.columnRuleColor;}
this.style.columnRuleColor=value;
this.style.msColumnRuleColor=value;
this.style.webkitColumnRuleColor=value;
this.style.MozColumnRuleColor=value;
this.style.OColumnRuleColor=value;
return this;
}
column_rule_style(value){
if (value==null){return this.style.columnRuleStyle;}
this.style.columnRuleStyle=value;
this.style.msColumnRuleStyle=value;
this.style.webkitColumnRuleStyle=value;
this.style.MozColumnRuleStyle=value;
this.style.OColumnRuleStyle=value;
return this;
}
column_rule_width(value){
if (value==null){return this.style.columnRuleWidth;}
this.style.columnRuleWidth=this.pad_numeric(value);
this.style.msColumnRuleWidth=this.pad_numeric(value);
this.style.webkitColumnRuleWidth=this.pad_numeric(value);
this.style.MozColumnRuleWidth=this.pad_numeric(value);
this.style.OColumnRuleWidth=this.pad_numeric(value);
return this;
}
column_span(value){
if (value==null){return this.style.columnSpan;}
this.style.columnSpan=value;
return this;
}
column_width(value){
if (value==null){return this.style.columnWidth;}
this.style.columnWidth=this.pad_numeric(value);
this.style.msColumnWidth=this.pad_numeric(value);
this.style.webkitColumnWidth=this.pad_numeric(value);
this.style.MozColumnWidth=this.pad_numeric(value);
this.style.OColumnWidth=this.pad_numeric(value);
return this;
}
columns(value){
if (value==null){return this.style.columns;}
this.style.columns=value;
return this;
}
content(value){
if (value==null){return this.style.content;}
this.style.content=value;
return this;
}
counter_increment(value){
if (value==null){return this.style.counterIncrement;}
this.style.counterIncrement=value;
return this;
}
counter_reset(value){
if (value==null){return this.style.counterReset;}
this.style.counterReset=value;
return this;
}
cursor(value){
if (value==null){return this.style.cursor;}
this.style.cursor=value;
return this;
}
direction(value){
if (value==null){return this.style.direction;}
this.style.direction=value;
return this;
}
empty_cells(value){
if (value==null){return this.style.emptyCells;}
this.style.emptyCells=value;
return this;
}
filter(value){
if (value==null){return this.style.filter;}
this.style.filter=value;
this.style.msFilter=value;
this.style.webkitFilter=value;
this.style.MozFilter=value;
this.style.OFilter=value;
return this;
}
flex(value){
if (value==null){return this.style.flex;}
this.style.flex=value;
this.style.msFlex=value;
this.style.webkitFlex=value;
this.style.MozFlex=value;
this.style.OFlex=value;
return this;
}
flex_basis(value){
if (value==null){return this.style.flexBasis;}
this.style.flexBasis=value;
this.style.msFlexBasis=value;
this.style.webkitFlexBasis=value;
this.style.MozFlexBasis=value;
this.style.OFlexBasis=value;
return this;
}
flex_direction(value){
if (value==null){return this.style.flexDirection;}
this.style.flexDirection=value;
this.style.msFlexDirection=value;
this.style.webkitFlexDirection=value;
this.style.MozFlexDirection=value;
this.style.OFlexDirection=value;
return this;
}
flex_flow(value){
if (value==null){return this.style.flexFlow;}
this.style.flexFlow=value;
this.style.msFlexFlow=value;
this.style.webkitFlexFlow=value;
this.style.MozFlexFlow=value;
this.style.OFlexFlow=value;
return this;
}
flex_grow(value){
if (value==null){return this.style.flexGrow;}
this.style.flexGrow=value;
this.style.msFlexGrow=value;
this.style.webkitFlexGrow=value;
this.style.MozFlexGrow=value;
this.style.OFlexGrow=value;
return this;
}
flex_shrink(value){
if (value==null){return this.style.flexShrink;}
this.style.flexShrink=value;
this.style.msFlexShrink=value;
this.style.webkitFlexShrink=value;
this.style.MozFlexShrink=value;
this.style.OFlexShrink=value;
return this;
}
flex_wrap(value){
if (value==null){return this.style.flexWrap;}
this.style.flexWrap=value;
this.style.msFlexWrap=value;
this.style.webkitFlexWrap=value;
this.style.MozFlexWrap=value;
this.style.OFlexWrap=value;
return this;
}
float(value){
if (value==null){return this.style.float;}
this.style.float=value;
return this;
}
font(value){
if (value==null){return this.style.font;}
this.style.font=value;
return this;
}
font_family(value){
if (value==null){return this.style.fontFamily;}
this.style.fontFamily=value;
return this;
}
font_feature_settings(value){
if (value==null){return this.style.fontFeatureSettings;}
this.style.fontFeatureSettings=value;
return this;
}
font_kerning(value){
if (value==null){return this.style.fontKerning;}
this.style.fontKerning=value;
return this;
}
font_language_override(value){
if (value==null){return this.style.fontLanguageOverride;}
this.style.fontLanguageOverride=value;
return this;
}
font_size(value){
if (value==null){return this.style.fontSize;}
this.style.fontSize=this.pad_numeric(value);
return this;
}
font_size_adjust(value){
if (value==null){return this.style.fontSizeAdjust;}
this.style.fontSizeAdjust=value;
return this;
}
font_stretch(value){
if (value==null){return this.style.fontStretch;}
this.style.fontStretch=value;
return this;
}
font_style(value){
if (value==null){return this.style.fontStyle;}
this.style.fontStyle=value;
return this;
}
font_synthesis(value){
if (value==null){return this.style.fontSynthesis;}
this.style.fontSynthesis=value;
return this;
}
font_variant(value){
if (value==null){return this.style.fontVariant;}
this.style.fontVariant=value;
return this;
}
font_variant_alternates(value){
if (value==null){return this.style.fontVariantAlternates;}
this.style.fontVariantAlternates=value;
return this;
}
font_variant_caps(value){
if (value==null){return this.style.fontVariantCaps;}
this.style.fontVariantCaps=value;
return this;
}
font_variant_east_asian(value){
if (value==null){return this.style.fontVariantEastAsian;}
this.style.fontVariantEastAsian=value;
return this;
}
font_variant_ligatures(value){
if (value==null){return this.style.fontVariantLigatures;}
this.style.fontVariantLigatures=value;
return this;
}
font_variant_numeric(value){
if (value==null){return this.style.fontVariantNumeric;}
this.style.fontVariantNumeric=value;
return this;
}
font_variant_position(value){
if (value==null){return this.style.fontVariantPosition;}
this.style.fontVariantPosition=value;
return this;
}
font_weight(value){
if (value==null){return this.style.fontWeight;}
this.style.fontWeight=value;
return this;
}
gap(value){
if (value==null){return this.style.gap;}
this.style.gap=value;
return this;
}
grid(value){
if (value==null){return this.style.grid;}
this.style.grid=value;
return this;
}
grid_area(value){
if (value==null){return this.style.gridArea;}
this.style.gridArea=value;
return this;
}
grid_auto_columns(value){
if (value==null){return this.style.gridAutoColumns;}
this.style.gridAutoColumns=value;
return this;
}
grid_auto_flow(value){
if (value==null){return this.style.gridAutoFlow;}
this.style.gridAutoFlow=value;
return this;
}
grid_auto_rows(value){
if (value==null){return this.style.gridAutoRows;}
this.style.gridAutoRows=value;
return this;
}
grid_column(value){
if (value==null){return this.style.gridColumn;}
this.style.gridColumn=value;
return this;
}
grid_column_end(value){
if (value==null){return this.style.gridColumnEnd;}
this.style.gridColumnEnd=value;
return this;
}
grid_column_gap(value){
if (value==null){return this.style.gridColumnGap;}
this.style.gridColumnGap=value;
return this;
}
grid_column_start(value){
if (value==null){return this.style.gridColumnStart;}
this.style.gridColumnStart=value;
return this;
}
grid_gap(value){
if (value==null){return this.style.gridGap;}
this.style.gridGap=value;
return this;
}
grid_row(value){
if (value==null){return this.style.gridRow;}
this.style.gridRow=value;
return this;
}
grid_row_end(value){
if (value==null){return this.style.gridRowEnd;}
this.style.gridRowEnd=value;
return this;
}
grid_row_gap(value){
if (value==null){return this.style.gridRowGap;}
this.style.gridRowGap=value;
return this;
}
grid_row_start(value){
if (value==null){return this.style.gridRowStart;}
this.style.gridRowStart=value;
return this;
}
grid_template(value){
if (value==null){return this.style.gridTemplate;}
this.style.gridTemplate=value;
return this;
}
grid_template_areas(value){
if (value==null){return this.style.gridTemplateAreas;}
this.style.gridTemplateAreas=value;
return this;
}
grid_template_columns(value){
if (value==null){return this.style.gridTemplateColumns;}
this.style.gridTemplateColumns=value;
return this;
}
grid_template_rows(value){
if (value==null){return this.style.gridTemplateRows;}
this.style.gridTemplateRows=value;
return this;
}
hanging_punctuation(value){
if (value==null){return this.style.hangingPunctuation;}
this.style.hangingPunctuation=value;
return this;
}
hyphens(value){
if (value==null){return this.style.hyphens;}
this.style.hyphens=value;
return this;
}
image_rendering(value){
if (value==null){return this.style.imageRendering;}
this.style.imageRendering=value;
return this;
}
inline_size(value){
if (value==null){return this.style.inlineSize;}
this.style.inlineSize=this.pad_numeric(value);
return this;
}
inset(value){
if (value==null){return this.style.inset;}
this.style.inset=value;
return this;
}
inset_block(value){
if (value==null){return this.style.insetBlock;}
this.style.insetBlock=value;
return this;
}
inset_block_end(value){
if (value==null){return this.style.insetBlockEnd;}
this.style.insetBlockEnd=value;
return this;
}
inset_block_start(value){
if (value==null){return this.style.insetBlockStart;}
this.style.insetBlockStart=value;
return this;
}
inset_inline(value){
if (value==null){return this.style.insetInline;}
this.style.insetInline=value;
return this;
}
inset_inline_end(value){
if (value==null){return this.style.insetInlineEnd;}
this.style.insetInlineEnd=value;
return this;
}
inset_inline_start(value){
if (value==null){return this.style.insetInlineStart;}
this.style.insetInlineStart=value;
return this;
}
isolation(value){
if (value==null){return this.style.isolation;}
this.style.isolation=value;
return this;
}
justify_content(value){
if (value==null){return this.style.justifyContent;}
this.style.justifyContent=value;
this.style.msJustifyContent=value;
this.style.webkitJustifyContent=value;
this.style.MozJustifyContent=value;
this.style.OJustifyContent=value;
return this;
}
justify_items(value){
if (value==null){return this.style.justifyItems;}
this.style.justifyItems=value;
return this;
}
justify_self(value){
if (value==null){return this.style.justifySelf;}
this.style.justifySelf=value;
return this;
}
left(value){
if (value==null){return this.style.left;}
this.style.left=this.pad_numeric(value);
return this;
}
letter_spacing(value){
if (value==null){return this.style.letterSpacing;}
this.style.letterSpacing=value;
return this;
}
line_break(value){
if (value==null){return this.style.lineBreak;}
this.style.lineBreak=value;
return this;
}
line_height(value){
if (value==null){return this.style.lineHeight;}
this.style.lineHeight=this.pad_numeric(value);
return this;
}
list_style(value){
if (value==null){return this.style.listStyle;}
this.style.listStyle=value;
return this;
}
list_style_image(value){
if (value==null){return this.style.listStyleImage;}
this.style.listStyleImage=value;
return this;
}
list_style_position(value){
if (value==null){return this.style.listStylePosition;}
this.style.listStylePosition=value;
return this;
}
list_style_type(value){
if (value==null){return this.style.listStyleType;}
this.style.listStyleType=value;
return this;
}
margin_block(value){
if (value==null){return this.style.marginBlock;}
this.style.marginBlock=value;
return this;
}
margin_block_end(value){
if (value==null){return this.style.marginBlockEnd;}
this.style.marginBlockEnd=value;
return this;
}
margin_block_start(value){
if (value==null){return this.style.marginBlockStart;}
this.style.marginBlockStart=value;
return this;
}
margin_inline(value){
if (value==null){return this.style.marginInline;}
this.style.marginInline=value;
return this;
}
margin_inline_end(value){
if (value==null){return this.style.marginInlineEnd;}
this.style.marginInlineEnd=value;
return this;
}
margin_inline_start(value){
if (value==null){return this.style.marginInlineStart;}
this.style.marginInlineStart=value;
return this;
}
mask(value){
if (value==null){return this.style.mask;}
this.style.mask=value;
this.style.msMask=value;
this.style.webkitMask=value;
this.style.MozMask=value;
this.style.OMask=value;
return this;
}
mask_clip(value){
if (value==null){return this.style.maskClip;}
this.style.maskClip=value;
return this;
}
mask_composite(value){
if (value==null){return this.style.maskComposite;}
this.style.maskComposite=value;
this.style.msMaskComposite=value;
this.style.webkitMaskComposite=value;
this.style.MozMaskComposite=value;
this.style.OMaskComposite=value;
return this;
}
mask_image(value){
if (value==null){return this.style.maskImage;}
this.style.maskImage=value;
this.style.msMaskImage=value;
this.style.webkitMaskImage=value;
this.style.MozMaskImage=value;
this.style.OMaskImage=value;
return this;
}
mask_mode(value){
if (value==null){return this.style.maskMode;}
this.style.maskMode=value;
return this;
}
mask_origin(value){
if (value==null){return this.style.maskOrigin;}
this.style.maskOrigin=value;
return this;
}
mask_position(value){
if (value==null){return this.style.maskPosition;}
this.style.maskPosition=value;
return this;
}
mask_repeat(value){
if (value==null){return this.style.maskRepeat;}
this.style.maskRepeat=value;
return this;
}
mask_size(value){
if (value==null){return this.style.maskSize;}
this.style.maskSize=this.pad_numeric(value);
return this;
}
mask_type(value){
if (value==null){return this.style.maskType;}
this.style.maskType=value;
return this;
}
max_height(value){
if (value==null){return this.style.maxHeight;}
this.style.maxHeight=this.pad_numeric(value);
return this;
}
max_width(value){
if (value==null){return this.style.maxWidth;}
this.style.maxWidth=this.pad_numeric(value);
return this;
}
max_block_size(value){
if (value==null){return this.style.maxBlockSize;}
this.style.maxBlockSize=this.pad_numeric(value);
return this;
}
max_inline_size(value){
if (value==null){return this.style.maxInlineSize;}
this.style.maxInlineSize=this.pad_numeric(value);
return this;
}
min_block_size(value){
if (value==null){return this.style.minBlockSize;}
this.style.minBlockSize=this.pad_numeric(value);
return this;
}
min_inline_size(value){
if (value==null){return this.style.minInlineSize;}
this.style.minInlineSize=this.pad_numeric(value);
return this;
}
mix_blend_mode(value){
if (value==null){return this.style.mixBlendMode;}
this.style.mixBlendMode=value;
return this;
}
object_fit(value){
if (value==null){return this.style.objectFit;}
this.style.objectFit=value;
return this;
}
object_position(value){
if (value==null){return this.style.objectPosition;}
this.style.objectPosition=value;
return this;
}
offset(value){
if (value==null){return this.style.offset;}
this.style.offset=value;
return this;
}
offset_anchor(value){
if (value==null){return this.style.offsetAnchor;}
this.style.offsetAnchor=value;
return this;
}
offset_distance(value){
if (value==null){return this.style.offsetDistance;}
this.style.offsetDistance=value;
return this;
}
offset_path(value){
if (value==null){return this.style.offsetPath;}
this.style.offsetPath=value;
return this;
}
offset_rotate(value){
if (value==null){return this.style.offsetRotate;}
this.style.offsetRotate=value;
return this;
}
order(value){
if (value==null){return this.style.order;}
this.style.order=value;
this.style.msOrder=value;
this.style.webkitOrder=value;
this.style.MozOrder=value;
this.style.OOrder=value;
return this;
}
orphans(value){
if (value==null){return this.style.orphans;}
this.style.orphans=value;
return this;
}
outline(value){
if (value==null){return this.style.outline;}
this.style.outline=value;
return this;
}
outline_color(value){
if (value==null){return this.style.outlineColor;}
this.style.outlineColor=value;
return this;
}
outline_offset(value){
if (value==null){return this.style.outlineOffset;}
this.style.outlineOffset=value;
return this;
}
outline_style(value){
if (value==null){return this.style.outlineStyle;}
this.style.outlineStyle=value;
return this;
}
outline_width(value){
if (value==null){return this.style.outlineWidth;}
this.style.outlineWidth=this.pad_numeric(value);
return this;
}
overflow(value){
if (value==null){return this.style.overflow;}
this.style.overflow=value;
return this;
}
overflow_anchor(value){
if (value==null){return this.style.overflowAnchor;}
this.style.overflowAnchor=value;
return this;
}
overflow_wrap(value){
if (value==null){return this.style.overflowWrap;}
this.style.overflowWrap=value;
return this;
}
overflow_x(value){
if (value==null){return this.style.overflowX;}
this.style.overflowX=value;
return this;
}
overflow_y(value){
if (value==null){return this.style.overflowY;}
this.style.overflowY=value;
return this;
}
overscroll_behavior(value){
if (value==null){return this.style.overscrollBehavior;}
this.style.overscrollBehavior=value;
return this;
}
overscroll_behavior_block(value){
if (value==null){return this.style.overscrollBehaviorBlock;}
this.style.overscrollBehaviorBlock=value;
return this;
}
overscroll_behavior_inline(value){
if (value==null){return this.style.overscrollBehaviorInline;}
this.style.overscrollBehaviorInline=value;
return this;
}
overscroll_behavior_x(value){
if (value==null){return this.style.overscrollBehaviorX;}
this.style.overscrollBehaviorX=value;
return this;
}
overscroll_behavior_y(value){
if (value==null){return this.style.overscrollBehaviorY;}
this.style.overscrollBehaviorY=value;
return this;
}
padding_block(value){
if (value==null){return this.style.paddingBlock;}
this.style.paddingBlock=value;
return this;
}
padding_block_end(value){
if (value==null){return this.style.paddingBlockEnd;}
this.style.paddingBlockEnd=value;
return this;
}
padding_block_start(value){
if (value==null){return this.style.paddingBlockStart;}
this.style.paddingBlockStart=value;
return this;
}
padding_inline(value){
if (value==null){return this.style.paddingInline;}
this.style.paddingInline=value;
return this;
}
padding_inline_end(value){
if (value==null){return this.style.paddingInlineEnd;}
this.style.paddingInlineEnd=value;
return this;
}
padding_inline_start(value){
if (value==null){return this.style.paddingInlineStart;}
this.style.paddingInlineStart=value;
return this;
}
page_break_after(value){
if (value==null){return this.style.pageBreakAfter;}
this.style.pageBreakAfter=value;
return this;
}
page_break_before(value){
if (value==null){return this.style.pageBreakBefore;}
this.style.pageBreakBefore=value;
return this;
}
page_break_inside(value){
if (value==null){return this.style.pageBreakInside;}
this.style.pageBreakInside=value;
return this;
}
paint_order(value){
if (value==null){return this.style.paintOrder;}
this.style.paintOrder=value;
return this;
}
perspective(value){
if (value==null){return this.style.perspective;}
this.style.perspective=value;
this.style.msPerspective=value;
this.style.webkitPerspective=value;
this.style.MozPerspective=value;
this.style.OPerspective=value;
return this;
}
perspective_origin(value){
if (value==null){return this.style.perspectiveOrigin;}
this.style.perspectiveOrigin=value;
this.style.msPerspectiveOrigin=value;
this.style.webkitPerspectiveOrigin=value;
this.style.MozPerspectiveOrigin=value;
this.style.OPerspectiveOrigin=value;
return this;
}
place_content(value){
if (value==null){return this.style.placeContent;}
this.style.placeContent=value;
return this;
}
place_items(value){
if (value==null){return this.style.placeItems;}
this.style.placeItems=value;
return this;
}
place_self(value){
if (value==null){return this.style.placeSelf;}
this.style.placeSelf=value;
return this;
}
pointer_events(value){
if (value==null){return this.style.pointerEvents;}
this.style.pointerEvents=value;
return this;
}
quotes(value){
if (value==null){return this.style.quotes;}
this.style.quotes=value;
return this;
}
resize(value){
if (value==null){return this.style.resize;}
this.style.resize=value;
return this;
}
right(value){
if (value==null){return this.style.right;}
this.style.right=this.pad_numeric(value);
return this;
}
row_gap(value){
if (value==null){return this.style.rowGap;}
this.style.rowGap=value;
return this;
}
scale(value){
if (value==null){return this.style.scale;}
this.style.scale=value;
return this;
}
scroll_behavior(value){
if (value==null){return this.style.scrollBehavior;}
this.style.scrollBehavior=value;
return this;
}
scroll_margin(value){
if (value==null){return this.style.scrollMargin;}
this.style.scrollMargin=value;
return this;
}
scroll_margin_block(value){
if (value==null){return this.style.scrollMarginBlock;}
this.style.scrollMarginBlock=value;
return this;
}
scroll_margin_block_end(value){
if (value==null){return this.style.scrollMarginBlockEnd;}
this.style.scrollMarginBlockEnd=value;
return this;
}
scroll_margin_block_start(value){
if (value==null){return this.style.scrollMarginBlockStart;}
this.style.scrollMarginBlockStart=value;
return this;
}
scroll_margin_bottom(value){
if (value==null){return this.style.scrollMarginBottom;}
this.style.scrollMarginBottom=this.pad_numeric(value);
return this;
}
scroll_margin_inline(value){
if (value==null){return this.style.scrollMarginInline;}
this.style.scrollMarginInline=value;
return this;
}
scroll_margin_inline_end(value){
if (value==null){return this.style.scrollMarginInlineEnd;}
this.style.scrollMarginInlineEnd=value;
return this;
}
scroll_margin_inline_start(value){
if (value==null){return this.style.scrollMarginInlineStart;}
this.style.scrollMarginInlineStart=value;
return this;
}
scroll_margin_left(value){
if (value==null){return this.style.scrollMarginLeft;}
this.style.scrollMarginLeft=this.pad_numeric(value);
return this;
}
scroll_margin_right(value){
if (value==null){return this.style.scrollMarginRight;}
this.style.scrollMarginRight=this.pad_numeric(value);
return this;
}
scroll_margin_top(value){
if (value==null){return this.style.scrollMarginTop;}
this.style.scrollMarginTop=this.pad_numeric(value);
return this;
}
scroll_padding(value){
if (value==null){return this.style.scrollPadding;}
this.style.scrollPadding=value;
return this;
}
scroll_padding_block(value){
if (value==null){return this.style.scrollPaddingBlock;}
this.style.scrollPaddingBlock=value;
return this;
}
scroll_padding_block_end(value){
if (value==null){return this.style.scrollPaddingBlockEnd;}
this.style.scrollPaddingBlockEnd=value;
return this;
}
scroll_padding_block_start(value){
if (value==null){return this.style.scrollPaddingBlockStart;}
this.style.scrollPaddingBlockStart=value;
return this;
}
scroll_padding_bottom(value){
if (value==null){return this.style.scrollPaddingBottom;}
this.style.scrollPaddingBottom=this.pad_numeric(value);
return this;
}
scroll_padding_inline(value){
if (value==null){return this.style.scrollPaddingInline;}
this.style.scrollPaddingInline=value;
return this;
}
scroll_padding_inline_end(value){
if (value==null){return this.style.scrollPaddingInlineEnd;}
this.style.scrollPaddingInlineEnd=value;
return this;
}
scroll_padding_inline_start(value){
if (value==null){return this.style.scrollPaddingInlineStart;}
this.style.scrollPaddingInlineStart=value;
return this;
}
scroll_padding_left(value){
if (value==null){return this.style.scrollPaddingLeft;}
this.style.scrollPaddingLeft=this.pad_numeric(value);
return this;
}
scroll_padding_right(value){
if (value==null){return this.style.scrollPaddingRight;}
this.style.scrollPaddingRight=this.pad_numeric(value);
return this;
}
scroll_padding_top(value){
if (value==null){return this.style.scrollPaddingTop;}
this.style.scrollPaddingTop=this.pad_numeric(value);
return this;
}
scroll_snap_align(value){
if (value==null){return this.style.scrollSnapAlign;}
this.style.scrollSnapAlign=value;
return this;
}
scroll_snap_stop(value){
if (value==null){return this.style.scrollSnapStop;}
this.style.scrollSnapStop=value;
return this;
}
scroll_snap_type(value){
if (value==null){return this.style.scrollSnapType;}
this.style.scrollSnapType=value;
return this;
}
scrollbar_color(value){
if (value==null){return this.style.scrollbarColor;}
this.style.scrollbarColor=value;
return this;
}
tab_size(value){
if (value==null){return this.style.tabSize;}
this.style.tabSize=value;
this.style.msTabSize=value;
this.style.webkitTabSize=value;
this.style.MozTabSize=value;
this.style.OTabSize=value;
return this;
}
table_layout(value){
if (value==null){return this.style.tableLayout;}
this.style.tableLayout=value;
return this;
}
text_align(value){
if (value==null){return this.style.textAlign;}
this.style.textAlign=value;
return this;
}
text_align_last(value){
if (value==null){return this.style.textAlignLast;}
this.style.textAlignLast=value;
return this;
}
text_combine_upright(value){
if (value==null){return this.style.textCombineUpright;}
this.style.textCombineUpright=value;
return this;
}
text_decoration(value){
if (value==null){return this.style.textDecoration;}
this.style.textDecoration=value;
return this;
}
text_decoration_color(value){
if (value==null){return this.style.textDecorationColor;}
this.style.textDecorationColor=value;
return this;
}
text_decoration_line(value){
if (value==null){return this.style.textDecorationLine;}
this.style.textDecorationLine=value;
return this;
}
text_decoration_style(value){
if (value==null){return this.style.textDecorationStyle;}
this.style.textDecorationStyle=value;
return this;
}
text_decoration_thickness(value){
if (value==null){return this.style.textDecorationThickness;}
this.style.textDecorationThickness=value;
return this;
}
text_emphasis(value){
if (value==null){return this.style.textEmphasis;}
this.style.textEmphasis=value;
return this;
}
text_indent(value){
if (value==null){return this.style.textIndent;}
this.style.textIndent=value;
return this;
}
text_justify(value){
if (value==null){return this.style.textJustify;}
this.style.textJustify=value;
return this;
}
text_orientation(value){
if (value==null){return this.style.textOrientation;}
this.style.textOrientation=value;
return this;
}
text_overflow(value){
if (value==null){return this.style.textOverflow;}
this.style.textOverflow=value;
return this;
}
text_shadow(value){
if (value==null){return this.style.textShadow;}
this.style.textShadow=value;
return this;
}
text_transform(value){
if (value==null){return this.style.textTransform;}
this.style.textTransform=value;
return this;
}
text_underline_position(value){
if (value==null){return this.style.textUnderlinePosition;}
this.style.textUnderlinePosition=value;
return this;
}
top(value){
if (value==null){return this.style.top;}
this.style.top=this.pad_numeric(value);
return this;
}
transform(value){
if (value==null){return this.style.transform;}
this.style.transform=value;
this.style.msTransform=value;
this.style.webkitTransform=value;
this.style.MozTransform=value;
this.style.OTransform=value;
return this;
}
transform_origin(value){
if (value==null){return this.style.transformOrigin;}
this.style.transformOrigin=value;
this.style.msTransformOrigin=value;
this.style.webkitTransformOrigin=value;
this.style.MozTransformOrigin=value;
this.style.OTransformOrigin=value;
return this;
}
transform_style(value){
if (value==null){return this.style.transformStyle;}
this.style.transformStyle=value;
this.style.msTransformStyle=value;
this.style.webkitTransformStyle=value;
this.style.MozTransformStyle=value;
this.style.OTransformStyle=value;
return this;
}
transition(value){
if (value==null){return this.style.transition;}
this.style.transition=value;
this.style.msTransition=value;
this.style.webkitTransition=value;
this.style.MozTransition=value;
this.style.OTransition=value;
return this;
}
transition_delay(value){
if (value==null){return this.style.transitionDelay;}
this.style.transitionDelay=value;
this.style.msTransitionDelay=value;
this.style.webkitTransitionDelay=value;
this.style.MozTransitionDelay=value;
this.style.OTransitionDelay=value;
return this;
}
transition_duration(value){
if (value==null){return this.style.transitionDuration;}
this.style.transitionDuration=value;
this.style.msTransitionDuration=value;
this.style.webkitTransitionDuration=value;
this.style.MozTransitionDuration=value;
this.style.OTransitionDuration=value;
return this;
}
transition_property(value){
if (value==null){return this.style.transitionProperty;}
this.style.transitionProperty=value;
this.style.msTransitionProperty=value;
this.style.webkitTransitionProperty=value;
this.style.MozTransitionProperty=value;
this.style.OTransitionProperty=value;
return this;
}
transition_timing_function(value){
if (value==null){return this.style.transitionTimingFunction;}
this.style.transitionTimingFunction=value;
this.style.msTransitionTimingFunction=value;
this.style.webkitTransitionTimingFunction=value;
this.style.MozTransitionTimingFunction=value;
this.style.OTransitionTimingFunction=value;
return this;
}
translate(value){
if (value==null){return this.style.translate;}
this.style.translate=value;
return this;
}
unicode_bidi(value){
if (value==null){return this.style.unicodeBidi;}
this.style.unicodeBidi=value;
return this;
}
user_select(value){
if (value==null){return this.style.userSelect;}
this.style.userSelect=value;
this.style.msUserSelect=value;
this.style.webkitUserSelect=value;
this.style.MozUserSelect=value;
this.style.OUserSelect=value;
return this;
}
visibility(value){
if (value==null){return this.style.visibility;}
this.style.visibility=value;
return this;
}
white_space(value){
if (value==null){return this.style.whiteSpace;}
this.style.whiteSpace=value;
return this;
}
widows(value){
if (value==null){return this.style.widows;}
this.style.widows=value;
return this;
}
word_break(value){
if (value==null){return this.style.wordBreak;}
this.style.wordBreak=value;
return this;
}
word_spacing(value){
if (value==null){return this.style.wordSpacing;}
this.style.wordSpacing=value;
return this;
}
word_wrap(value){
if (value==null){return this.style.wordWrap;}
this.style.wordWrap=value;
return this;
}
writing_mode(value){
if (value==null){return this.style.writingMode;}
this.style.writingMode=value;
return this;
}
accept(value){
if (value==null){return super.accept;}
super.accept=value;
return this;
}
accept_charset(value){
if (value==null){return super.accept_charset;}
super.accept_charset=value;
return this;
}
action(value){
if (value==null){return super.action;}
super.action=value;
return this;
}
async(value){
if (value==null){return super.async;}
super.async=value;
return this;
}
auto_complete(value){
if (value==null){return super.autocomplete;}
super.autocomplete=value;
return this;
}
auto_focus(value){
if (value==null){return super.autofocus;}
super.autofocus=value;
return this;
}
auto_play(value){
if (value==null){return super.autoplay;}
super.autoplay=value;
return this;
}
charset(value){
if (value==null){return super.charset;}
super.charset=value;
return this;
}
checked(value){
if (value==null){return super.checked;}
super.checked=value;
return this;
}
cite(value){
if (value==null){return super.cite;}
super.cite=value;
return this;
}
cols(value){
if (value==null){return super.cols;}
super.cols=value;
return this;
}
colspan(value){
if (value==null){return super.colspan;}
super.colspan=value;
return this;
}
content(value){
if (value==null){return super.content;}
super.content=value;
return this;
}
content_editable(value){
if (value==null){return super.contenteditable;}
super.contenteditable=value;
return this;
}
controls(value){
if (value==null){return super.controls;}
super.controls=value;
return this;
}
coords(value){
if (value==null){return super.coords;}
super.coords=value;
return this;
}
data(value){
if (value==null){return super.data;}
super.data=value;
return this;
}
datetime(value){
if (value==null){return super.datetime;}
super.datetime=value;
return this;
}
default(value){
if (value==null){return super.default;}
super.default=value;
return this;
}
defer(value){
if (value==null){return super.defer;}
super.defer=value;
return this;
}
dir(value){
if (value==null){return super.dir;}
super.dir=value;
return this;
}
dirname(value){
if (value==null){return super.dirname;}
super.dirname=value;
return this;
}
disabled(value){
if (value==null){return super.disabled;}
super.disabled=value;
return this;
}
draggable(value){
if (value==null){return super.draggable;}
super.draggable=value;
return this;
}
enctype(value){
if (value==null){return super.enctype;}
super.enctype=value;
return this;
}
for(value){
if (value==null){return super.for;}
super.for=value;
return this;
}
form(value){
if (value==null){return super.form;}
super.form=value;
return this;
}
form_action(value){
if (value==null){return super.formaction;}
super.formaction=value;
return this;
}
headers(value){
if (value==null){return super.headers;}
super.headers=value;
return this;
}
high(value){
if (value==null){return super.high;}
super.high=value;
return this;
}
href(value){
if (value==null){return super.href;}
super.href=value;
return this;
}
href_lang(value){
if (value==null){return super.hreflang;}
super.hreflang=value;
return this;
}
http_equiv(value){
if (value==null){return super.http_equiv;}
super.http_equiv=value;
return this;
}
id(value){
if (value==null){return super.id;}
super.id=value;
return this;
}
is_map(value){
if (value==null){return super.ismap;}
super.ismap=value;
return this;
}
kind(value){
if (value==null){return super.kind;}
super.kind=value;
return this;
}
label(value){
if (value==null){return super.label;}
super.label=value;
return this;
}
lang(value){
if (value==null){return super.lang;}
super.lang=value;
return this;
}
list(value){
if (value==null){return super.list;}
super.list=value;
return this;
}
loop(value){
if (value==null){return super.loop;}
super.loop=value;
return this;
}
low(value){
if (value==null){return super.low;}
super.low=value;
return this;
}
max(value){
if (value==null){return super.max;}
super.max=value;
return this;
}
max_length(value){
if (value==null){return super.maxlength;}
super.maxlength=value;
return this;
}
method(value){
if (value==null){return super.method;}
super.method=value;
return this;
}
min(value){
if (value==null){return super.min;}
super.min=value;
return this;
}
multiple(value){
if (value==null){return super.multiple;}
super.multiple=value;
return this;
}
muted(value){
if (value==null){return super.muted;}
super.muted=value;
return this;
}
no_validate(value){
if (value==null){return super.novalidate;}
super.novalidate=value;
return this;
}
open(value){
if (value==null){return super.open;}
super.open=value;
return this;
}
optimum(value){
if (value==null){return super.optimum;}
super.optimum=value;
return this;
}
pattern(value){
if (value==null){return super.pattern;}
super.pattern=value;
return this;
}
placeholder(value){
if (value==null){return super.placeholder;}
super.placeholder=value;
return this;
}
poster(value){
if (value==null){return super.poster;}
super.poster=value;
return this;
}
preload(value){
if (value==null){return super.preload;}
super.preload=value;
return this;
}
rel(value){
if (value==null){return super.rel;}
super.rel=value;
return this;
}
required(value){
if (value==null){return super.required;}
super.required=value;
return this;
}
reversed(value){
if (value==null){return super.reversed;}
super.reversed=value;
return this;
}
rows(value){
if (value==null){return super.rows;}
super.rows=value;
return this;
}
row_span(value){
if (value==null){return super.rowspan;}
super.rowspan=value;
return this;
}
sandbox(value){
if (value==null){return super.sandbox;}
super.sandbox=value;
return this;
}
scope(value){
if (value==null){return super.scope;}
super.scope=value;
return this;
}
selected(value){
if (value==null){return super.selected;}
super.selected=value;
return this;
}
shape(value){
if (value==null){return super.shape;}
super.shape=value;
return this;
}
size(value){
if (value==null){return super.size;}
super.size=value;
return this;
}
sizes(value){
if (value==null){return super.sizes;}
super.sizes=value;
return this;
}
span(value){
if (value==null){return super.span;}
super.span=value;
return this;
}
spell_check(value){
if (value==null){return super.spellcheck;}
super.spellcheck=value;
return this;
}
src(value){
if (value==null){return super.src;}
super.src=value;
return this;
}
src_doc(value){
if (value==null){return super.srcdoc;}
super.srcdoc=value;
return this;
}
src_lang(value){
if (value==null){return super.srclang;}
super.srclang=value;
return this;
}
rrsrc_set(value){
if (value==null){return super.srcset;}
super.srcset=value;
return this;
}
start(value){
if (value==null){return super.start;}
super.start=value;
return this;
}
step(value){
if (value==null){return super.step;}
super.step=value;
return this;
}
tab_index(value){
if (value==null){return super.tabindex;}
super.tabindex=value;
return this;
}
target(value){
if (value==null){return super.target;}
super.target=value;
return this;
}
title(value){
if (value==null){return super.title;}
super.title=value;
return this;
}
translate(value){
if (value==null){return super.translate;}
super.translate=value;
return this;
}
type(value){
if (value==null){return super.type;}
super.type=value;
return this;
}
use_map(value){
if (value==null){return super.usemap;}
super.usemap=value;
return this;
}
value(value){
if (value==null){return super.value;}
super.value=value;
return this;
}
on_after_print(callback){
if (callback==null){return this.onafterprint;}
const e=this;
this.onafterprint=(t)=>callback(e,t);
return this;
}
on_before_print(callback){
if (callback==null){return this.onbeforeprint;}
const e=this;
this.onbeforeprint=(t)=>callback(e,t);
return this;
}
on_before_unload(callback){
if (callback==null){return this.onbeforeunload;}
const e=this;
this.onbeforeunload=(t)=>callback(e,t);
return this;
}
on_error(callback){
if (callback==null){return this.onerror;}
const e=this;
this.onerror=(t)=>callback(e,t);
return this;
}
on_hash_change(callback){
if (callback==null){return this.onhashchange;}
const e=this;
this.onhashchange=(t)=>callback(e,t);
return this;
}
on_message(callback){
if (callback==null){return this.onmessage;}
const e=this;
this.onmessage=(t)=>callback(e,t);
return this;
}
on_offline(callback){
if (callback==null){return this.onoffline;}
const e=this;
this.onoffline=(t)=>callback(e,t);
return this;
}
on_online(callback){
if (callback==null){return this.ononline;}
const e=this;
this.ononline=(t)=>callback(e,t);
return this;
}
on_page_hide(callback){
if (callback==null){return this.onpagehide;}
const e=this;
this.onpagehide=(t)=>callback(e,t);
return this;
}
on_page_show(callback){
if (callback==null){return this.onpageshow;}
const e=this;
this.onpageshow=(t)=>callback(e,t);
return this;
}
on_popstate(callback){
if (callback==null){return this.onpopstate;}
const e=this;
this.onpopstate=(t)=>callback(e,t);
return this;
}
on_storage(callback){
if (callback==null){return this.onstorage;}
const e=this;
this.onstorage=(t)=>callback(e,t);
return this;
}
on_unload(callback){
if (callback==null){return this.onunload;}
const e=this;
this.onunload=(t)=>callback(e,t);
return this;
}
on_blur(callback){
if (callback==null){return this.onblur;}
const e=this;
this.onblur=(t)=>callback(e,t);
return this;
}
on_change(callback){
if (callback==null){return this.onchange;}
const e=this;
this.onchange=(t)=>callback(e,t);
return this;
}
on_focus(callback){
if (callback==null){return this.onfocus;}
const e=this;
this.onfocus=(t)=>callback(e,t);
return this;
}
on_input(callback){
if (callback==null){return this.oninput;}
const e=this;
this.oninput=(t)=>callback(e,t);
return this;
}
on_before_input(callback){
if (callback==null){return this.onbeforeinput;}
const e=this;
this.onbeforeinput=(t)=>callback(e,t);
return this;
}
on_invalid(callback){
if (callback==null){return this.oninvalid;}
const e=this;
this.oninvalid=(t)=>callback(e,t);
return this;
}
on_reset(callback){
if (callback==null){return this.onreset;}
const e=this;
this.onreset=(t)=>callback(e,t);
return this;
}
on_search(callback){
if (callback==null){return this.onsearch;}
const e=this;
this.onsearch=(t)=>callback(e,t);
return this;
}
on_select(callback){
if (callback==null){return this.onselect;}
const e=this;
this.onselect=(t)=>callback(e,t);
return this;
}
on_submit(callback){
if (callback==null){return this.onsubmit;}
const e=this;
this.onsubmit=(t)=>callback(e,t);
return this;
}
on_key_down(callback){
if (callback==null){return this.onkeydown;}
const e=this;
this.onkeydown=(t)=>callback(e,t);
return this;
}
on_key_press(callback){
if (callback==null){return this.onkeypress;}
const e=this;
this.onkeypress=(t)=>callback(e,t);
return this;
}
on_key_up(callback){
if (callback==null){return this.onkeyup;}
const e=this;
this.onkeyup=(t)=>callback(e,t);
return this;
}
on_dbl_click(callback){
if (callback==null){return this.ondblclick;}
const e=this;
this.ondblclick=(t)=>callback(e,t);
return this;
}
on_mouse_down(callback){
if (callback==null){return this.onmousedown;}
const e=this;
this.onmousedown=(t)=>callback(e,t);
return this;
}
on_mouse_move(callback){
if (callback==null){return this.onmousemove;}
const e=this;
this.onmousemove=(t)=>callback(e,t);
return this;
}
on_mouse_out(callback){
if (callback==null){return this.onmouseout;}
const e=this;
this.onmouseout=(t)=>callback(e,t);
return this;
}
on_mouse_over(callback){
if (callback==null){return this.onmouseover;}
const e=this;
this.onmouseover=(t)=>callback(e,t);
return this;
}
on_mouse_up(callback){
if (callback==null){return this.onmouseup;}
const e=this;
this.onmouseup=(t)=>callback(e,t);
return this;
}
on_mouse_wheel(callback){
if (callback==null){return this.onmousewheel;}
const e=this;
this.onmousewheel=(t)=>callback(e,t);
return this;
}
on_wheel(callback){
if (callback==null){return this.onwheel;}
const e=this;
this.onwheel=(t)=>callback(e,t);
return this;
}
on_drag(callback){
if (callback==null){return this.ondrag;}
const e=this;
this.ondrag=(t)=>callback(e,t);
return this;
}
on_drag_end(callback){
if (callback==null){return this.ondragend;}
const e=this;
this.ondragend=(t)=>callback(e,t);
return this;
}
on_drag_enter(callback){
if (callback==null){return this.ondragenter;}
const e=this;
this.ondragenter=(t)=>callback(e,t);
return this;
}
on_drag_leave(callback){
if (callback==null){return this.ondragleave;}
const e=this;
this.ondragleave=(t)=>callback(e,t);
return this;
}
on_drag_over(callback){
if (callback==null){return this.ondragover;}
const e=this;
this.ondragover=(t)=>callback(e,t);
return this;
}
on_drag_start(callback){
if (callback==null){return this.ondragstart;}
const e=this;
this.ondragstart=(t)=>callback(e,t);
return this;
}
on_drop(callback){
if (callback==null){return this.ondrop;}
const e=this;
this.ondrop=(t)=>callback(e,t);
return this;
}
on_copy(callback){
if (callback==null){return this.oncopy;}
const e=this;
this.oncopy=(t)=>callback(e,t);
return this;
}
on_cut(callback){
if (callback==null){return this.oncut;}
const e=this;
this.oncut=(t)=>callback(e,t);
return this;
}
on_paste(callback){
if (callback==null){return this.onpaste;}
const e=this;
this.onpaste=(t)=>callback(e,t);
return this;
}
on_abort(callback){
if (callback==null){return this.onabort;}
const e=this;
this.onabort=(t)=>callback(e,t);
return this;
}
on_canplay(callback){
if (callback==null){return this.oncanplay;}
const e=this;
this.oncanplay=(t)=>callback(e,t);
return this;
}
on_canplay_through(callback){
if (callback==null){return this.oncanplaythrough;}
const e=this;
this.oncanplaythrough=(t)=>callback(e,t);
return this;
}
on_cue_change(callback){
if (callback==null){return this.oncuechange;}
const e=this;
this.oncuechange=(t)=>callback(e,t);
return this;
}
on_duration_change(callback){
if (callback==null){return this.ondurationchange;}
const e=this;
this.ondurationchange=(t)=>callback(e,t);
return this;
}
on_emptied(callback){
if (callback==null){return this.onemptied;}
const e=this;
this.onemptied=(t)=>callback(e,t);
return this;
}
on_ended(callback){
if (callback==null){return this.onended;}
const e=this;
this.onended=(t)=>callback(e,t);
return this;
}
on_error(callback){
if (callback==null){return this.onerror;}
const e=this;
this.onerror=(t)=>callback(e,t);
return this;
}
on_loaded_data(callback){
if (callback==null){return this.onloadeddata;}
const e=this;
this.onloadeddata=(t)=>callback(e,t);
return this;
}
on_loaded_metadata(callback){
if (callback==null){return this.onloadedmetadata;}
const e=this;
this.onloadedmetadata=(t)=>callback(e,t);
return this;
}
on_load_start(callback){
if (callback==null){return this.onloadstart;}
const e=this;
this.onloadstart=(t)=>callback(e,t);
return this;
}
on_pause(callback){
if (callback==null){return this.onpause;}
const e=this;
this.onpause=(t)=>callback(e,t);
return this;
}
on_play(callback){
if (callback==null){return this.onplay;}
const e=this;
this.onplay=(t)=>callback(e,t);
return this;
}
on_playing(callback){
if (callback==null){return this.onplaying;}
const e=this;
this.onplaying=(t)=>callback(e,t);
return this;
}
onprogress(callback){
if (callback==null){return this.onprogress;}
const e=this;
this.onprogress=(t)=>callback(e,t);
return this;
}
on_rate_change(callback){
if (callback==null){return this.onratechange;}
const e=this;
this.onratechange=(t)=>callback(e,t);
return this;
}
on_seeked(callback){
if (callback==null){return this.onseeked;}
const e=this;
this.onseeked=(t)=>callback(e,t);
return this;
}
on_seeking(callback){
if (callback==null){return this.onseeking;}
const e=this;
this.onseeking=(t)=>callback(e,t);
return this;
}
on_stalled(callback){
if (callback==null){return this.onstalled;}
const e=this;
this.onstalled=(t)=>callback(e,t);
return this;
}
on_suspend(callback){
if (callback==null){return this.onsuspend;}
const e=this;
this.onsuspend=(t)=>callback(e,t);
return this;
}
on_time_update(callback){
if (callback==null){return this.ontimeupdate;}
const e=this;
this.ontimeupdate=(t)=>callback(e,t);
return this;
}
on_volume_change(callback){
if (callback==null){return this.onvolumechange;}
const e=this;
this.onvolumechange=(t)=>callback(e,t);
return this;
}
on_waiting(callback){
if (callback==null){return this.onwaiting;}
const e=this;
this.onwaiting=(t)=>callback(e,t);
return this;
}
on_toggle(callback){
if (callback==null){return this.ontoggle;}
const e=this;
this.ontoggle=(t)=>callback(e,t);
return this;
}
};
vweb._velement_classes.push(Element);
customElements.define("v-base-"+type.toLowerCase(),Element,{extends:tag});
return Element;
};
const VElementElement=CreateVElementClass({type:"VElement",tag:"div"});
function VElement(...args){return new VElementElement(...args);}
const StyleElement=CreateVElementClass({type:"Style",tag:"style"});
function Style(...args){return new StyleElement(...args);}
window.onload=()=>{
vweb.events.emit("vweb.on_load");
}
class AnchorElement extends CreateVElementClass({
type:"Anchor",
tag:"a",
default_style:{
"font-family":"inherit",
"font-size":"inherit",
"color":"inherit",
"text-decoration":"none",
"text-underline-position":"none",
"cursor":"pointer",
"outline":"none",
"border":"none",
},
}){
constructor(href,alt,text){
super();
this.href(href);
this.alt(alt);
this.text(text??alt);
}
};function Anchor(...args){return new AnchorElement(...args)};;vweb.elements.register(AnchorElement);
class LinkElement extends CreateVElementClass({
type:"Link",
tag:"a",
default_style:{
"font-family":"inherit",
"font-size":"1em",
"color":"rgb(85, 108, 214)",
"text-decoration":"underline",
"text-underline-position":"auto",
"cursor":"pointer",
},
}){
constructor(text,href){
super();
this.text(text);
this.href(href);
}
};function Link(...args){return new LinkElement(...args)};;vweb.elements.register(LinkElement);
class FrameElement extends CreateVElementClass({
type:"Frame",
tag:"div",
default_style:{
"margin":"0px",
"padding":"0px",
"display":"block",
"overflow":"visible",
},
}){
constructor(...children){
super();
this.append(...children);
}
};function Frame(...args){return new FrameElement(...args)};;vweb.elements.register(FrameElement);
class VStackElement extends CreateVElementClass({
type:"VStack",
tag:"div",
default_style:{
"margin":"0px",
"padding":"0px",
"display":"flex",
"overflow":"visible",
"align-content":"flex-start",
"flex-direction":"column",
"outline":"none",
"border":"none",
},
}){
constructor(...children){
super();
this.append(...children);
}
};function VStack(...args){return new VStackElement(...args)};;vweb.elements.register(VStackElement);
class AnchorVStackElement extends CreateVElementClass({
type:"AnchorVStack",
tag:"a",
default_style:{
"margin":"0px",
"padding":"0px",
"display":"flex",
"overflow":"visible",
"align-content":"flex-start",
"flex-direction":"column",
"outline":"none",
"border":"none",
"text-decoration":"none",
"color":"inherit",
},
}){
constructor(...children){
super();
this.append(...children);
}
};function AnchorVStack(...args){return new AnchorVStackElement(...args)};;vweb.elements.register(AnchorVStackElement);
class HStackElement extends CreateVElementClass({
type:"HStack",
tag:"div",
default_style:{
"margin":"0px",
"padding":"0px",
"overflow-x":"visible",
"overflow-y":"visible",
"display":"flex",
"flex-direction":"row",
"align-items":"flex-start",
"border":"0px",
"flex:":"1 1 auto",
"outline":"none",
"border":"none",
},
}){
constructor(...children){
super();
this.append(...children);
}
};function HStack(...args){return new HStackElement(...args)};;vweb.elements.register(HStackElement);
class AnchorHStackElement extends CreateVElementClass({
type:"AnchorHStack",
tag:"a",
default_style:{
"margin":"0px",
"padding":"0px",
"overflow-x":"visible",
"overflow-y":"visible",
"display":"flex",
"flex-direction":"row",
"align-items":"flex-start",
"border":"0px",
"flex:":"1 1 auto",
"outline":"none",
"border":"none",
"text-decoration":"none",
"color":"inherit",
},
}){
constructor(...children){
super();
this.append(...children);
}
};function AnchorHStack(...args){return new AnchorHStackElement(...args)};;vweb.elements.register(AnchorHStackElement);
Array.prototype.append=Array.prototype.push;
Array.prototype.first=function(){
return this[0];
};
Array.prototype.last=function(){
return this[this.length-1];
};
Array.prototype.iterate=function(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=start;i<end;i++){
const res=handler(this[i]);
if (res!=null&&!(res instanceof Promise)){
return res;
}
}
return null;
};
Array.prototype.iterate_async=function(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
let promises=[];
for (let i=start;i<end;i++){
const res=handler(this[i]);
if (res!=null&&res instanceof Promise){
promises.push(res);
}
}
return promises;
};
Array.prototype.iterate_async_await=async function(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=start;i<end;i++){
const res=handler(this[i]);
if (res!=null&&res instanceof Promise){
const pres=await res;
if (pres!=null){
return pres;
}
}
}
return null;
};
Array.prototype.iterate_append=function(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
const items=[];
for (let i=start;i<end;i++){
items.append(handler(this[i]));
}
return items;
};
Array.prototype.iterate_reversed=function(start,end,handler){
if (handler==null&&start!=null){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=end-1;i>=start;i--){
const res=handler(this[i]);
if (res!=null&&!(res instanceof Promise)){
return res;
}
}
return null;
};
Array.prototype.iterate_reversed_async=function(start,end,handler){
if (handler==null&&start!=null){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
let promises=[];
for (let i=end-1;i>=start;i--){
const res=handler(this[i]);
if (res!=null&&res instanceof Promise){
promises.push(res);
}
}
return promises;
};
Array.prototype.iterate_reversed_async_await=async function(start,end,handler){
if (handler==null&&start!=null){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=end-1;i>=start;i--){
const res=handler(this[i]);
if (res!=null&&res instanceof Promise){
const pres=await res;
if (pres!=null){
return pres;
}
}
}
return null;
};
Array.prototype.drop=function(item){
const dropped=new this.constructor();
for (let i=0;i<this.length;i++){
if (this[i]!==item){
dropped.push(this[i])
}
}
return dropped;
};
Array.prototype.drop_index=function(index){
const dropped=new this.constructor();
for (let i=0;i<this.length;i++){
if (i!=index){
dropped.push(this[i])
}
}
return dropped;
};
Array.prototype.drop_duplicates=function(){
return this.reduce((accumulator,val)=>{
if (!accumulator.includes(val)){
accumulator.push(val);
}
return accumulator;
},[]);
}
Array.prototype.limit_from_end=function(limit){
let limited=[];
if (this.length>limit){
for (let i=this.length-limit;i<this.length;i++){
limited.push(this[i]);
}
}else {
for (let i=0;i<this.length;i++){
limited.push(this[i]);
}
}
return limited;
}
Array.prototype.remove=function(item){
let removed=[];
this.iterate((i)=>{
if (i!=item){
removed.push(i);
}
})
return removed;
};
Array.prototype.eq=function(x=null,y=null){
const eq=(x,y)=>{
if (Array.isArray(x)){
if (
Array.isArray(y)===false||
x.length!==y.length
){
return false;
}
for (let i=0;i<x.length;i++){
if (typeof x[i]==="object"||typeof y[i]==="object"){
const result=eq(x[i],y[i]);
if (result===false){
return false;
}
}else if (x[i]!==y[i]){
return false;
}
}
return true;
}
else if (typeof x==="object"){
if (
typeof y!=="object"||
Array.isArray(y)
){
return false;
}
const x_keys=Object.keys(x);
const y_keys=Object.keys(y);
if (eq(x_keys,y_keys)===false){
return false;
}
for (let i=0;i<x_keys.length;i++){
if (typeof x[x_keys[i]]==="object"||typeof y[y_keys[i]]==="object"){
const result=eq(x[x_keys[i]],y[y_keys[i]]);
if (result===false){
return false;
}
}else if (x[x_keys[i]]!==y[y_keys[i]]){
return false;
}
}
return true;
}
else if (typeof x!==typeof y){return false;}
return x===y;
}
if (y==null){
y=x;
x=this;
}
return eq(x,y);
}
Array.prototype.divide=function(x){
if (typeof x!=='number'||x<=0){
throw new Error('Number of nested arrays must be a positive number');
}
const result=[];
const nested_len=Math.ceil(this.length/x);
for (let i=0;i<this.length;i+=nested_len){
result.push(this.slice(i,i+nested_len));
}
return result;
}
vweb.auth={};
vweb.auth.sign_in=function({
email="",
username="",
password="",
code="",
}){
return vweb.utils.request({
method:"POST",
url:"/vweb/auth/signin",
data:{
email:email,
username:username,
password:password,
code:code,
},
});
}
vweb.auth.sign_up=function({
username="",
email="",
first_name="",
last_name="",
password="",
verify_password="",
phone_number="",
code="",
}){
return vweb.utils.request({
method:"POST",
url:"/vweb/auth/signup",
data:{
username,
email,
first_name,
last_name,
password,
verify_password,
phone_number,
code,
},
});
}
vweb.auth.sign_out=function(){
return vweb.utils.request({
method:"POST",
url:"/vweb/auth/signout",
});
}
vweb.auth.send_2fa=function(email=""){
return vweb.utils.request({
method:"GET",
url:"/vweb/auth/2fa",
data:{
email:email,
},
});
}
vweb.auth.forgot_password=function({
email="",
code="",
password="",
verify_password="",
}){
return vweb.utils.request({
method:"POST",
url:"/vweb/auth/forgot_password",
data:{
email:email,
code:code,
password:password,
verify_password:verify_password,
},
});
}
vweb.colors=class Colors{
static black="\u001b[30m";
static red="\u001b[31m";
static red_bold="\u001b[31m\u001b[1m";
static green="\u001b[32m";
static yellow="\u001b[33m";
static blue="\u001b[34m";
static magenta="\u001b[35m";
static cyan="\u001b[36m";
static gray="\u001b[37m";
static bold="\u001b[1m";
static italic="\u001b[3m";
static end="\u001b[0m";
static enable(){
Colors.black="\u001b[30m";
Colors.red="\u001b[31m";
Colors.red_bold="\u001b[31m\u001b[1m";
Colors.green="\u001b[32m";
Colors.yellow="\u001b[33m";
Colors.blue="\u001b[34m";
Colors.magenta="\u001b[35m";
Colors.cyan="\u001b[36m";
Colors.gray="\u001b[37m";
Colors.bold="\u001b[1m";
Colors.italic="\u001b[3m";
Colors.end="\u001b[0m";
}
static disable(){
Colors.black="";
Colors.red="";
Colors.red_bold="";
Colors.green="";
Colors.yellow="";
Colors.blue="";
Colors.magenta="";
Colors.cyan="";
Colors.gray="";
Colors.bold="";
Colors.italic="";
Colors.end="";
}
}
vweb.color={
black:(data)=>`${vweb.colors.black}${data}${vweb.colors.end}`,
red:(data)=>`${vweb.colors.red}${data}${vweb.colors.end}`,
red_bold:(data)=>`${vweb.colors.red_bold}${data}${vweb.colors.end}`,
green:(data)=>`${vweb.colors.green}${data}${vweb.colors.end}`,
yellow:(data)=>`${vweb.colors.yellow}${data}${vweb.colors.end}`,
blue:(data)=>`${vweb.colors.blue}${data}${vweb.colors.end}`,
magenta:(data)=>`${vweb.colors.magenta}${data}${vweb.colors.end}`,
cyan:(data)=>`${vweb.colors.cyan}${data}${vweb.colors.end}`,
gray:(data)=>`${vweb.colors.gray}${data}${vweb.colors.end}`,
bold:(data)=>`${vweb.colors.bold}${data}${vweb.colors.end}`,
italic:(data)=>`${vweb.colors.italic}${data}${vweb.colors.end}`,
end:(data)=>`${vweb.colors.end}${data}${vweb.colors.end}`,
}
vweb.Date=class D extends Date{
constructor(...args){
super(...args);
}
format(format){
let formatted="";
for (let i=0;i<format.length;i++){
if (format[i]==="%"){
switch (format[i+1]){
case '%':
formatted+="%";
++i;
break;
case 'a':
formatted+=new Intl.DateTimeFormat('en-US',{weekday:'short'}).format(this);
++i;
break;
case 'A':
formatted+=new Intl.DateTimeFormat('en-US',{weekday:'long'}).format(this);
++i;
break;
case 'b':
case 'h':
formatted+=new Intl.DateTimeFormat('en-US',{month:'short'}).format(this);
++i;
break;
case 'B':
formatted+=new Intl.DateTimeFormat('en-US',{month:'long'}).format(this);
++i;
break;
case 'C':
formatted+=Math.floor(this.getFullYear()/100);
++i;
break;
case 'd':
formatted+=String(this.getDate()).padStart(2,'0');
++i;
break;
case 'e':
formatted+=String(this.getDate());
++i;
break;
case 'D':
formatted+=this.format("%m/%d/%y");
++i;
break;
case 'F':
formatted+=this.format("%Y-%m-%d");
++i;
break;
case 'H':
formatted+=String(this.getHours()).padStart(2,'0');
++i;
break;
case 'I':
formatted+=String((this.getHours()%12)||12).padStart(2,'0');
++i;
break;
case 'j':
formatted+=String(
Math.floor((this-new Date(this.getFullYear(),0,0))/(86400*1000))
).padStart(3,'0');
++i;
break;
case 'k':
formatted+=String(this.getHours());
++i;
break;
case 'l':
formatted+=String((this.getHours()%12)||12);
++i;
break;
case 'm':
formatted+=String(this.getMonth()+1).padStart(2,'0');
++i;
break;
case 'M':
formatted+=String(this.getMinutes()).padStart(2,'0');
++i;
break;
case 'n':
formatted+="\n";
++i;
break;
case 'N':
formatted+=String(this.getMilliseconds()).padStart(Number(format[i+2])||3,'0');
i+=2;
break;
case 'p':
formatted+=new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:true }).format(this);
++i;
break;
case 'P':
formatted+=new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:true }).format(this).toLowerCase();
++i;
break;
case 'r':
formatted+=this.format("%I:%M:%S %p");
++i;
break;
case 'R':
formatted+=this.format("%H:%M");
++i;
break;
case 's':
formatted+=Math.floor(this.getTime()/1000);
++i;
break;
case 'S':
formatted+=String(this.getSeconds()).padStart(2,'0');
++i;
break;
case 't':
formatted+="\t";
++i;
break;
case 'T':
formatted+=this.format("%H:%M:%S");
++i;
break;
case 'u':
formatted+=this.getDay()||7;
++i;
break;
case 'U':
formatted+=String(
Math.ceil((this-new Date(this.getFullYear(),0,1))/(86400*1000)+1)/7
).padStart(2,'0');
++i;
break;
case 'V':
const jan4=new Date(this.getFullYear(),0,4);
const startOfWeek=new Date(this.getFullYear(),0,1);
const daysSinceJan4=Math.floor((this-jan4)/(86400*1000));
const weekNumber=Math.ceil((daysSinceJan4+jan4.getDay()+1)/7);
formatted+=String(weekNumber).padStart(2,'0');
++i;
break;
case 'w':
formatted+=this.getDay();
++i;
break;
case 'W':
formatted+=String(
Math.floor((this-new Date(this.getFullYear(),0,1))/(86400*1000)+1)/7
).padStart(2,'0');
++i;
break;
case 'x':
formatted+=new Intl.DateTimeFormat('en-US').format(this);
++i;
break;
case 'X':
formatted+=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'numeric',second:'numeric'}).format(this);
++i;
break;
case 'y':
formatted+=String(this.getFullYear()).slice(-2);
++i;
break;
case 'Y':
formatted+=String(this.getFullYear());
++i;
break;
case ':':
case 'z':
const timezoneOffset=this.getTimezoneOffset();
const sign=timezoneOffset>0?'-':'+';
const hours=String(Math.floor(Math.abs(timezoneOffset)/60)).padStart(2,'0');
const minutes=String(Math.abs(timezoneOffset)%60).padStart(2,'0');
if (format[i+1]==="z"){
formatted+=`${sign}${hours}${minutes}`;
i+=1;
}
else if (format[i+2]==="z"){
formatted+=`${sign}${hours}:${minutes}`;
i+=2;
}
else if (format[i+3]==="z"){
formatted+=`${sign}${hours}:${minutes}:${this.format('XN')}`;
i+=3;
}
else if (format[i+4]==="z"){
formatted+=`${sign}${hours}:${minutes}:${this.format('XN').slice(0,2)}`;
i+=4;
}
break;
case 'Z':
formatted+=Intl.DateTimeFormat('en-US',{timeZoneName:'short'}).format(this);
++i;
break;
default:
formatted+=format[i];
break;
}
}else {
formatted+=format[i];
}
}
return formatted;
}
msec(){return this.getTime();}
sec(){return parseInt(this.getTime()/1000);}
hour_start(){
const date=new D(this.getTime())
date.setMinutes(0,0,0);
return date;
}
day_start(){
const date=new D(this.getTime())
date.setHours(0,0,0,0);
return date;
}
day_start(){
const date=new D(this.getTime())
date.setHours(0,0,0,0);
return date;
}
week_start(sunday_start=true){
const diff=(this.getDay()+7-(sunday_start?0:1))%7;
const date=new D(this.getTime())
date.setDate(this.getDate()-diff)
date.setHours(0,0,0,0);;
return date;
}
month_start(){
const date=new D(this.getTime())
date.setDate(1)
date.setHours(0,0,0,0,0);
return date;
}
quarter_year_start(){
const date=new D(this.getTime())
const month=date.getMonth()+1;
if (month>9){
date.setMonth(9-1,1)
date.setHours(0,0,0,0,0);
}else if (month>6){
date.setMonth(6-1,1)
date.setHours(0,0,0,0,0);
}else if (month>3){
date.setMonth(3-1,1)
date.setHours(0,0,0,0,0);
}else {
date.setMonth(0,1)
date.setHours(0,0,0,0,0);
}
return date;
}
half_year_start(){
const date=new D(this.getTime())
if (date.getMonth()+1>6){
date.setMonth(5,1)
date.setHours(0,0,0,0,0);
}else {
date.setMonth(0,1)
date.setHours(0,0,0,0,0);
}
return date;
}
year_start(){
const date=new D(this.getTime())
date.setMonth(0,1)
date.setHours(0,0,0,0,0);
return date;
}
}
vweb.events={
events:new Map(),
};
vweb.events.emit=function(id,args={}){
const callbacks=this.events.get(id);
if (callbacks==null){
return ;
}
callbacks.iterate((i)=>{
i[1](i[0],args);
})
}
vweb.events.on=function(id,element,callback){
let callbacks=this.events.get(id);
if (callbacks==null){
callbacks=[];
this.events.set(id,callbacks)
}
callbacks.append([element,callback]);
}
vweb.events.remove=function(id,element,callback){
const callbacks=this.events.get(id);
if (callbacks==null){return ;}
const filtered=[];
callbacks.iterate((i)=>{
if (i[0]===element&&(callback==null||i[1]===callback)){
return null;
}
filtered.append(i);
})
this.events.set(id,filtered);
}
vweb.meta={};
vweb.meta.set=function({
author=null,
title=null,
description=null,
image=null,
favicon=null,
}){
const set_content_query=(query,content)=>{
const e=document.querySelector(query);
if (e){
e.content=content;
return true;
}
return false;
}
const set_content_og=(property,content)=>{
let exists=set_content_query(`meta[property='${property}']`,content);
if (!exists){
exists=set_content_query(`meta[name='${property}']`,content);
if (!exists){
}
}
}
if (author!=null){
set_content_og("author",author);
}
if (title!=null){
document.title=title;
set_content_og("og:title",title);
set_content_og("twitter:title",title);
}
if (description!=null){
set_content_og("description",description);
set_content_og("og:description",description);
set_content_og("twitter:description",description);
}
if (image!=null){
set_content_og("og:image",image);
set_content_og("twitter:image",description);
}
}
Number.random=function(x,y){
if (typeof x!=='number'||typeof y!=='number'||x>=y){
throw new Error('Invalid input. x and y must be numbers, and x should be less than y.');
}
return Math.floor(Math.random()*(y-x+1))+x;
}
vweb.internal.obj_eq=function(x,y,detect_keys=false,detect_keys_nested=false){
if (typeof x!==typeof y){return false;}
else if (x instanceof String){
return x.toString()===y.toString();
}
else if (Array.isArray(x)){
if (!Array.isArray(y)||x.length!==y.length){return false;}
for (let i=0;i<x.length;i++){
if (!vweb.internal.obj_eq(x[i],y[i])){
return false;
}
}
return true;
}
else if (x!=null&&typeof x==="object"){
const changes=[];
const x_keys=Object.keys(x);
const y_keys=Object.keys(y);
if (x_keys.length!==y_keys.length){
return false;
}
for (const key of x_keys){
if (!y.hasOwnProperty(key)){
const result=vweb.internal.obj_eq(x[key],y[key],detect_keys,detect_keys_nested)
if (detect_keys){
if (result===true){
changes.append(key)
}
else if (result!==false&&result.length>0){
changes.append(key)
if (detect_keys_nested){
changes.append(...result)
}
}
}else if (!result){
return false
}
}
}
if (detect_keys){
return changes.length===0?null :changes;
}
return true;
}
else {
return x===y;
}
}
vweb.internal.deep_copy=(obj)=>{
if (Array.isArray(obj)){
const copy=[];
obj.iterate((item)=>{
copy.append(vweb.internal.deep_copy(item));
})
return copy;
}
else if (obj!==null&&obj instanceof String){
return new String(obj.toString());
}
else if (obj!==null&&typeof obj==="object"){
const copy={};
const keys=Object.keys(obj);
const values=Object.values(obj);
for (let i=0;i<keys.length;i++){
copy[keys[i]]=vweb.internal.deep_copy(values[i]);
}
return copy;
}
else {
return obj;
}
}
Object.expand=function(x,y){
const keys=Object.keys(y);
for (let i=0;i<keys.length;i++){
x[keys[i]]=y[keys[i]];
}
return x;
}
Object.eq=function(x,y){
return vweb.internal.obj_eq(x,y);
}
Object.detect_changes=function(x,y,include_nested=false){
return vweb.internal.obj_eq(x,y, true,include_nested);
}
Object.rename_keys=(obj={},rename=[["old","new"]],remove=[])=>{
remove.iterate((key)=>{
delete obj[key];
})
rename.iterate((key)=>{
obj[key[1]]=obj[key[0]];
delete obj[key[0]];
})
return obj;
}
Object.deep_copy=(obj)=>{
return vweb.internal.deep_copy(obj);
}
Object.delete_recursively=(obj,remove_keys=[])=>{
const clean=(obj)=>{
if (Array.isArray(obj)){
obj.iterate((item)=>{
if (Array.isArray(item)||(typeof item==="object"&&item!=null)){
clean(item);
}
})
}else {
Object.keys(obj).iterate((key)=>{
if (remove_keys.includes(key)){
delete obj[key];
}
else if (Array.isArray(obj[key])||(typeof obj[key]==="object"&&obj[key]!=null)){
clean(obj[key]);
}
})
}
}
clean(obj);
return obj;
}
vweb.scheme={};
vweb.scheme.value_type=function (value){
if (value==null){return "null";}
else if (typeof value==="object"&&Array.isArray(value)){return "array";}
else {return typeof value;}
}
vweb.scheme.init_scheme_item=(scheme_item,scheme=undefined,scheme_key=undefined)=>{
if (typeof scheme_item==="string"){
scheme_item={type:scheme_item};
if (scheme!==undefined&&scheme_key!==undefined){
scheme[scheme_key]=scheme_item;
}
}
else {
if (scheme_item.def!==undefined){
scheme_item.default=scheme_item.def;
delete scheme_item.def;
}
if (scheme_item.attrs!==undefined){
scheme_item.scheme=scheme_item.attrs;
delete scheme_item.attrs;
}
else if (scheme_item.attributes!==undefined){
scheme_item.scheme=scheme_item.attributes;
delete scheme_item.attributes;
}
if (scheme_item.enumerate!==undefined){
scheme_item.enum=scheme_item.enumerate;
delete scheme_item.enumerate;
}
}
return scheme_item;
}
vweb.scheme.type_error_str=(scheme_item,prefix=" of type ")=>{
let type_error_str="";
if (Array.isArray(scheme_item.type)){
type_error_str=prefix;
for (let i=0;i<scheme_item.type.length;i++){
if (typeof scheme_item.type[i]==="function"){
try {
type_error_str+=`"${scheme_item.type[i].name}"`
}catch (e){
type_error_str+=`"${scheme_item.type[i]}"`
}
}else {
type_error_str+=`"${scheme_item.type[i]}"`
}
if (i===scheme_item.type.length-2){
type_error_str+=" or "
}else if (i<scheme_item.type.length-2){
type_error_str+=", "
}
}
}else {
type_error_str=`${prefix}"${scheme_item.type}"`
}
return type_error_str;
}
vweb.scheme.verify=function({
object={},
scheme={},
value_scheme=null,
check_unknown=false,
parent="",
error_prefix="",
err_prefix=null,
throw_err=true,
}){
if (err_prefix!==null){
error_prefix=err_prefix;
}
const throw_err_h=(e,field)=>{
const invalid_fields={};
invalid_fields[field]=e;
if (throw_err===false){
return {error:e,invalid_fields,object:null};
}
const error=new Error(e);
error.json={error:e,invalid_fields,object:null};
throw error;
}
const check_type=(object,obj_key,scheme_item,type)=>{
if (typeof type==="function"){
return object[obj_key] instanceof type;
}
switch (type){
case "null":
return object[obj_key]==null;
case "array":{
if (Array.isArray(object[obj_key])===false){
return false;
}
if (scheme_item.scheme||scheme_item.value_scheme){
try {
object[obj_key]=vweb.scheme.verify({
object:object[obj_key],
scheme:scheme_item.scheme,
value_scheme:scheme_item.value_scheme,
check_unknown,
parent:`${parent}${obj_key}.`,
error_prefix,
throw_err:true,
});
}catch (e){
if (!throw_err&&e.json){return e.json;}
else {throw e;}
}
}
if (typeof scheme_item.min_length==="number"&&object[obj_key].length<scheme_item.min_length){
const field=`${parent}${obj_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid array length [${object[obj_key].length}], the minimum length is [${scheme_item.min_length}].`,field);
}
if (typeof scheme_item.max_length==="number"&&object[obj_key].length>scheme_item.max_length){
const field=`${parent}${obj_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid array length [${object[obj_key].length}], the maximum length is [${scheme_item.max_length}].`,field);
}
return true;
}
case "object":{
if (typeof object[obj_key]!=="object"||object[obj_key]==null){
return false;
}
if (scheme_item.scheme||scheme_item.value_scheme){
try {
object[obj_key]=vweb.scheme.verify({
object:object[obj_key],
scheme:scheme_item.scheme,
value_scheme:scheme_item.value_scheme,
check_unknown,
parent:`${parent}${obj_key}.`,
error_prefix,
throw_err:true,
});
}catch (e){
if (!throw_err&&e.json){return e.json;}
else {throw e;}
}
}
return true;
}
case "string":{
if (typeof object[obj_key]!=="string"&&!(object[obj_key] instanceof String)){
return false;
}
if (scheme_item.allow_empty!==true&&object[obj_key].length===0){
return 1;
}
if (typeof scheme_item.min_length==="number"&&object[obj_key].length<scheme_item.min_length){
const field=`${parent}${obj_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid string length [${object[obj_key].length}], the minimum length is [${scheme_item.min_length}].`,field);
}
if (typeof scheme_item.max_length==="number"&&object[obj_key].length>scheme_item.max_length){
const field=`${parent}${obj_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid string length [${object[obj_key].length}], the maximum length is [${scheme_item.max_length}].`,field);
}
}
default:
if (type!==typeof object[obj_key]){
return false;
}
if (type==="string"&&scheme_item.allow_empty!==true&&object[obj_key].length===0){
return 1;
}
return true;
}
}
const verify_value_scheme=(scheme_item,key,object,value_scheme_key=undefined)=>{
if (typeof scheme_item.preprocess==="function"){
const res=scheme_item.preprocess(object[key],object,key);
if (res!==undefined){
object[key]=res;
}
}
if (scheme_item.type&&scheme_item.type!=="any"){
const is_required=scheme_item.required??true;
if (scheme_item.default===null&&object[key]==null){
}
else if (Array.isArray(scheme_item.type)){
let correct_type=false;
let is_empty=false;
for (let i=0;i<scheme_item.type.length;i++){
const res=check_type(object,key,scheme_item,scheme_item.type[i]);
if (typeof res==="object"){
return res;
}
else if (res===true){
correct_type=true;
break;
}
else if (res===1){
correct_type=true;
is_empty=true;
break;
}
}
if (correct_type===false){
const field=`${parent}${value_scheme_key||key}`;
const current_type=vweb.scheme.value_type(object[key]);
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${vweb.scheme.type_error_str(scheme_item,"")}.`,field);
}
else if (is_empty&&is_required&&scheme_item.default!==""){
const field=`${parent}${value_scheme_key||key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" is an empty string.`,field);
}
}
else {
const res=check_type(object,key,scheme_item,scheme_item.type);
if (typeof res==="object"){
return res;
}
else if (res===false){
const field=`${parent}${value_scheme_key||key}`;
const current_type=vweb.scheme.value_type(object[key]);
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${vweb.scheme.type_error_str(scheme_item,"")}.`,field);
}
else if (res===1&&is_required&&scheme_item.default!==""){
const field=`${parent}${value_scheme_key||key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" is an empty string.`,field);
}
}
}
if (scheme_item.enum){
if (!scheme_item.enum.includes(object[key])){
const field=`${parent}${value_scheme_key||key}`;
const joined=scheme_item.enum.map(item=>{
if (item==null){
return 'null';
}else if (typeof item!=="string"&&!(item instanceof String)){
return item.toString();
}
return `"${item.toString()}"`;
}).join(", ");
return throw_err_h(`${error_prefix}Attribute "${field}" must be one of the following enumerated values [${joined}].`,field);
}
}
if (typeof scheme_item.verify==="function"){
const err=scheme_item.verify(object[key],object,key);
if (err){
return throw_err_h(`${error_prefix}${err}`,`${parent}${value_scheme_key||key}`);
}
}
if (typeof scheme_item.callback==="function"){
let stack=new Error("SPLIT-AFTER").stack.split("SPLIT-AFTER\n")[1].split('\n');
let last=-1;
for (let i=0;i<stack.length;i++){
if (stack[i].includes('at vweb.scheme.verify ')){
last=i;
}
}
if (last!==-1){
stack=stack.slice(last);
}
console.warn(`${vweb.colors.end}[vweb.scheme.verify] ${vweb.colors.yellow}Warning${vweb.colors.end}: Attribute "callback" is deprecated and replaced by attribute "verify" and will be removed in future versions.\n${stack.join('\n')}`);
const err=scheme_item.callback(object[key],object,key);
if (err){
return throw_err_h(`${error_prefix}${err}`,`${parent}${value_scheme_key||key}`);
}
}
if (typeof scheme_item.postprocess==="function"){
const res=scheme_item.postprocess(object[key],object,key);
if (res!==undefined){
object[key]=res;
}
}
}
if (Array.isArray(object)){
scheme=value_scheme;
if (scheme!=null){
const scheme_item=vweb.scheme.init_scheme_item(scheme);
for (let index=0;index<object.length;index++){
const err=verify_value_scheme(scheme_item,index,object);
if (err){return err;}
}
}
}
else {
if (value_scheme!=null){
const scheme_item=vweb.scheme.init_scheme_item(value_scheme);
const keys=Object.keys(object);
for (let i=0;i<keys.length;i++){
const err=verify_value_scheme(scheme_item,keys[i],object);
if (err){return err;}
}
}
else {
if (check_unknown){
const object_keys=Object.keys(object);
for (let x=0;x<object_keys.length;x++){
if (object_keys[x] in scheme===false){
const field=`${parent}${object_keys[x]}`;
return throw_err_h(`${error_prefix}Attribute "${field}" is not a valid attribute name.`,field);
}
}
}
const scheme_keys=Object.keys(scheme);
for (let scheme_index=0;scheme_index<scheme_keys.length;scheme_index++){
const scheme_key=scheme_keys[scheme_index];
let scheme_item=vweb.scheme.init_scheme_item(scheme[scheme_key],scheme,scheme_key);
if (typeof scheme_item.alias==="string"){
scheme_item=vweb.scheme.init_scheme_item(scheme[scheme_item.alias],scheme,scheme_item.alias);
}
if (scheme_key in object===false){
if (scheme_item.default!==undefined){
if (typeof scheme_item.default==="function"){
object[scheme_key]=scheme_item.default(object);
}else {
object[scheme_key]=scheme_item.default;
}
}
else {
if (scheme_item.required===false){
continue;
}
else if (typeof scheme_item.required==="function"){
const required=scheme_item.required(object);
if (required){
const field=`${parent}${scheme_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${vweb.scheme.type_error_str(scheme_item)}.`,field);
}
}else {
const field=`${parent}${scheme_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${vweb.scheme.type_error_str(scheme_item)}.`,field);
}
}
continue;
}
const err=verify_value_scheme(scheme_item,scheme_key,object);
if (err){return err;}
}
}
}
if (throw_err===false){
return {error:null,invalid_fields:{},object};
}
return object;
}
vweb.scheme._type_string=function(type=[],prefix=""){
if (typeof type==="string"){
return `${prefix}"${type}"`;
}
if (Array.isArray(type)&&type.length>0){
let str=prefix;
for (let i=0;i<type.length;i++){
if (typeof type[i]==="function"){
try {
str+=`"${type[i].name}"`
}catch (e){
str+=`"${type[i]}"`
}
}else {
str+=`"${type[i]}"`
}
if (i===type.length-2){
str+=" or "
}else if (i<type.length-2){
str+=", "
}
}
return str;
}
return "";
}
vweb.scheme.throw_undefined=function(name,type,throw_err=true){
if (typeof name==="object"&&name!=null){
({
name,
type=[],
throw_err=true,
}=name);
}
const err=`Argument "${name}" should be a defined value${vweb.scheme._type_string(type," of type ")}.`
if (throw_err){
throw new Error(err);
}
return err;
}
vweb.scheme.throw_invalid_type=function(
name,
value,
type=[],
throw_err=true,
){
if (typeof name==="object"&&name!=null){
({
name,
value,
type=[],
throw_err=true,
}=name);
}
const err=`Invalid type "${vweb.scheme.value_type(value)}" for argument "${name}${vweb.scheme._type_string(type,", the valid type is ")}.`
if (throw_err){
throw new Error(err);
}
return err;
}
vweb.static={}
vweb.static.aspect_ratios={};
vweb.static.aspect_ratio=function(endpoint){
if (endpoint.first()!=="/"){
endpoint="/"+endpoint;
}
let index=endpoint.indexOf("?");
if (index!==-1){
endpoint=endpoint.substr(0,index);
}
endpoint=endpoint.replaceAll("//","/");
while (endpoint.last()==="/"){
endpoint=endpoint.substr(0,endpoint.length-1);
}
return vweb.static.aspect_ratios[endpoint];
}
String.prototype.first=function(){
return this[0];
};
String.prototype.last=function(){
return this[this.length-1];
};
String.prototype.first_non_whitespace=function(line_break=false){
for (let i=0;i<this.length;i++){
const char=this.charAt(i);
if (char!=" "&&char!="\t"&&(line_break==false||char!="\n")){
return char;
}
}
return null;
};
String.prototype.last_non_whitespace=function(line_break=false){
for (let i=this.length-1;i>=0;i--){
const char=this.charAt(i);
if (char!=" "&&char!="\t"&&(line_break==false||char!="\n")){
return char;
}
}
return null;
};
String.prototype.first_not_of=function(exclude=[],start_index=0){
for (let i=start_index;i<this.length;i++){
if (!exclude.includes(this.charAt(i))){
return this.charAt(i);
}
}
return null;
};
String.prototype.first_index_not_of=function(exclude=[],start_index=0){
for (let i=start_index;i<this.length;i++){
if (!exclude.includes(this.charAt(i))){
return i;
}
}
return null;
};
String.prototype.last_not_of=function(exclude=[],start_index=null){
if (start_index===null){
start_index=this.length-1;
}
for (let i=start_index;i>=0;i--){
if (!exclude.includes(this.charAt(i))){
return this.charAt(i);
}
}
return null;
};
String.prototype.last_index_not_of=function(exclude=[],start_index=null){
if (start_index===null){
start_index=this.length-1;
}
for (let i=start_index;i>=0;i--){
if (!exclude.includes(this.charAt(i))){
return i;
}
}
return null;
};
String.prototype.insert=function(index,substr){
let edited=this.substr(0,index);
edited+=substr;
edited+=this.substr(index);
return edited;
};
String.prototype.remove_indices=function(start,end){
let edited=this.substr(0,start);
edited+=this.substr(end);
return edited;
};
String.prototype.replace_indices=function(substr,start,end){
let edited=this.substr(0,start);
edited+=substr;
edited+=this.substr(end);
return edited;
};
String.prototype.eq_first=function(substr,start_index=0){
if (start_index+substr.length>this.length){
return false;
}
const end=start_index+substr.length;
let y=0;
for (let x=start_index;x<end;x++){
if (this.charAt(x)!=substr.charAt(y)){
return false;
}
++y;
}
return true;
}
String.prototype.eq_last=function(substr){
if (substr.length>this.length){
return false;
}
let y=0;
for (let x=this.length-substr.length;x<this.length;x++){
if (this.charAt(x)!=substr.charAt(y)){
return false;
}
++y;
}
return true;
}
String.prototype.ensure_last=function(ensure_last){
if (ensure_last.indexOf(this.charAt(this.length-1))===-1){
return this+ensure_last.charAt(0);
}
return this;
}
String.prototype.is_uppercase=function(allow_digits=false){
let uppercase="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
if (allow_digits){
uppercase+="0123456789";
}
for (let i=0;i<this.length;i++){
if (uppercase.indexOf(this.charAt(i))===-1){
return false;
}
}
return true;
}
String.prototype.capitalize_word=function(){
if ("abcdefghijklmopqrstuvwxyz".includes(this.charAt(0))){
return this.charAt(0).toUpperCase()+this.substr(1);
}
return this;
}
String.prototype.capitalize_words=function(){
let batch="";
let capitalized="";
for (let i=0;i<this.length;i++){
const c=this.charAt(i);
if (c===" "||c==="\t"||c==="\n"){
capitalized+=batch.capitalize_word();
batch="";
capitalized+=c;
}else {
batch+=c;
}
}
capitalized+=batch.capitalize_word();
return capitalized;
}
String.prototype.drop=function(char){
const is_array=Array.isArray(char);
let dropped="";
for (let i=0;i<this.length;i++){
const c=this.charAt(i);
if (is_array){
if (char.includes(c)===false){
dropped+=c;
}
}else {
if (char!==c){
dropped+=c;
}
}
}
return dropped;
}
String.prototype.reverse=function(){
let reversed="";
for (let i=this.length-1;i>=0;i--){
reversed+=this.charAt(i);
}
return reversed;
}
String.random=function(length=32){
const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let result="";
for (let i=0;i<length;i++){
result+=chars.charAt(Math.floor(Math.random()*chars.length));
}
return result;
}
String.prototype.is_integer_string=function(){
const chars='0123456789';
for (let i=0;i<this.length;i++){
if (chars.indexOf(this.charAt(i))===-1){
return false;
}
}
return true;
}
String.prototype.is_floating_string=function(){
const chars='0123456789';
let decimal=false;
for (let i=0;i<this.length;i++){
const char=this.charAt(i);
if (char==='.'){
if (decimal){return false;}
decimal=true;
}else if (chars.indexOf(char)===-1){
return false;
}
}
return decimal;
}
String.prototype.is_numeric_string=function(info=false){
const chars='0123456789';
let decimal=false;
for (let i=0;i<this.length;i++){
const char=this.charAt(i);
if (char==='.'){
if (decimal){return false;}
decimal=true;
}else if (chars.indexOf(char)===-1){
if (info){
return {integer:false,floating:false};
}
return false;
}
}
if (info){
return {integer:decimal===false,floating:decimal===true};
}
return true;
}
String.prototype.unquote=function(){
if ((this.startsWith('"')&&this.endsWith('"'))||(this.startsWith("'")&&this.endsWith("'"))){
return this.slice(1,-1);
}
return this;
}
String.prototype.quote=function(){
if ((this.startsWith('"')&&this.endsWith('"'))||(this.startsWith("'")&&this.endsWith("'"))){
return this;
}
return `"${this}"`;
}
vweb.support={};
vweb.support.submit=function(data={}){
return vweb.utils.request({
method:"POST",
url:"/vweb/support/submit",
data:data,
});
}
vweb.support.get_pin=function(){
return vweb.utils.request({
method:"GET",
url:"/vweb/support/pin",
});
}
vweb.themes={};
vweb.themes.theme_elements=[];
vweb.themes.set=function(theme_id){
vweb.themes.theme_elements.iterate((theme)=>{
if (theme.id===theme_id&&theme.is_empty_theme!==true){
const e=theme.element;
Object.keys(theme).iterate((key)=>{
if (key!=="id"&&key!=="element"){
if (e[key]===undefined){
console.error(`"${key}()" is not a valid function of type "${e.element_type}"`);
return null;
}
if (Array.isArray(theme[key])){
e[key](...theme[key]);
}else {
e[key](theme[key]);
}
}
})
if (e.element_type==="RingLoader"){
e.update(e);
}
if (Array.isArray(e._on_theme_updates)){
e._on_theme_updates.iterate((func)=>func(e,theme.id));
}
}
})
}
vweb.themes.apply_theme_update=function(){
vweb.themes.theme_elements.iterate((theme)=>{
const e=theme.element;
if (e!==undefined&&Array.isArray(e._on_theme_updates)){
e._on_theme_updates.iterate((func)=>func(e,theme.id));
}
})
}
vweb.user={};
vweb.user.uid=function(){
let uid=vweb.cookies.get("UserID");
if (uid=="-1"){
return null;
}
return uid;
}
vweb.user.username=function(){
let username=vweb.cookies.get("UserName");
if (username==""){
username=null;
}
return username;
}
vweb.user.email=function(){
let email=vweb.cookies.get("UserEmail");
if (email==""){
email=null;
}
return email;
}
vweb.user.first_name=function(){
let first_name=vweb.cookies.get("UserFirstName");
if (first_name==""){
first_name=null;
}
return first_name;
}
vweb.user.last_name=function(){
let last_name=vweb.cookies.get("UserLastName");
if (last_name==""){
last_name=null;
}
return last_name;
}
vweb.user.is_authenticated=function(){
return this.uid()!=null;
}
vweb.user.is_activated=function(){
return vweb.cookies.get("UserActivated")==="true";
}
vweb.user.get=async function(detailed=false){
return vweb.utils.request({
method:"GET",
url:"/vweb/user/",
data:{
detailed:detailed,
}
});
}
vweb.user.set=async function(user){
return vweb.utils.request({
method:"POST",
url:"/vweb/user/",
data:user,
});
}
vweb.user.activate=async function(code=""){
return vweb.utils.request({
method:"POST",
url:"/vweb/auth/activate",
data:{
"code":code,
},
});
}
vweb.user.change_password=async function({
current_password="",
password="",
verify_password="",
}){
return vweb.utils.request({
method:"POST",
url:"/vweb/user/change_password",
data:{
current_password:current_password,
password:password,
verify_password:verify_password,
},
});
}
vweb.user.delete_account=async function(){
return vweb.utils.request({
method:"DELETE",
url:"/vweb/user",
});
}
vweb.user.generate_api_key=async function(){
return vweb.utils.request({
method:"POST",
url:"/vweb/user/api_key",
});
}
vweb.user.revoke_api_key=async function(){
return vweb.utils.request({
method:"DELETE",
url:"/vweb/user/api_key",
});
}
vweb.user.load=async function(path,def=""){
return vweb.utils.request({
method:"GET",
url:"/vweb/user/data",
data:{
path:path,
def:"",
},
});
}
vweb.user.save=async function(path="",data={}){
return vweb.utils.request({
method:"POST",
url:"/vweb/user/data",
data:{
path:path,
data:data,
},
});
}
vweb.user.load_protected=async function(path,def=""){
return vweb.utils.request({
method:"GET",
url:"/vweb/user/data/protected",
data:{
path:path,
def:def,
},
});
}
class ButtonElement extends CreateVElementClass({
type:"Button",
tag:"a",
default_style:{
"margin":"0px 0px 0px",
"padding":"5px 10px 5px 10px",
"outline":"none",
"border":"none",
"border-radius":"10px",
"cursor":"pointer",
"text-decoration":"none",
"color":"inherit",
"text-align":"center",
"display":"grid",
"align-items":"center",
"white-space":"nowrap",
"user-select":"none",
"text-decoration":"none",
},
default_events:{
"onmousedown":function(){this.style.filter="brightness(80%)";},
"onmouseover":function(){this.style.filter="brightness(90%)";},
"onmouseup":function(){this.style.filter="brightness(100%)";},
"onmouseout":function(){this.style.filter="brightness(100%)";},
},
}){
constructor(text){
super();
this.inner_html(text);
}
};function Button(...args){return new ButtonElement(...args)};;vweb.elements.register(ButtonElement);
class BorderButtonElement extends CreateVElementClass({
type:"BorderButton",
tag:"a",
default_style:{
"margin":"0px 0px 0px 0px",
"display":"inline-block",
"color":"inherit",
"text-align":"center",
"cursor":"pointer",
"text-decoration":"none",
"position":"relative",
"z-index":0,
"background":"none",
"user-select":"none",
"outline":"none",
"border":"none",
"text-decoration":"none",
"--child-color":"black",
"--child-background":"black",
"--child-border-width":"2px",
"--child-border-radius":"10px",
"--child-padding":"5px 10px 5px 10px",
},
default_events:{
"onmousedown":function(){this.style.filter="brightness(80%)";},
"onmouseover":function(){this.style.filter="brightness(90%)";},
"onmouseup":function(){this.style.filter="brightness(100%)";},
"onmouseout":function(){this.style.filter="brightness(100%)";},
},
}){
constructor(text){
super();
this.border_e=VElement()
.content("")
.position("absolute")
.inset(0)
.padding(BorderButtonElement.default_style["--child-border-width"])
.border_radius(BorderButtonElement.default_style["--child-border-radius"])
.background(BorderButtonElement.default_style["--child-background"])
.mask("linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)")
.mask_composite("exclude")
.styles({
"-webkit-mask":"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
"-webkit-mask-composite":(navigator.userAgent.includes("Firefox")||navigator.userAgent.includes("Mozilla"))?"exclude":"xor",
})
this.text_e=VElement()
.color(BorderButtonElement.default_style["--child-color"])
.append(text);
if (BorderButtonElement.default_style["--child-color"]=="transparent"){
this.text_e.style.backgroundImage=BorderButtonElement.default_style["--child-background-image"];
this.text_e.style.backgroundClip=BorderButtonElement.default_style["--child-background-clip"];
this.text_e.style["-webkit-background-clip"]=BorderButtonElement.default_style["--child-webkit-background-clip"];
}
this.append(this.border_e, this.text_e);
}
gradient(value){
if (value==null){
return this.border_e.background();
}
this.border_e.background(value);
return this;
}
border_color(value){
if (value==null){
return this.border_e.background();
}
this.border_e.background(value);
return this;
}
border_width(value){
if (value==null){
return this.border_e.padding();
}
this.border_e.padding(value);
return this;
}
border_radius(value){
if (value==null){
return this.border_e.border_radius();
}
super.border_radius(value);
this.border_e.border_radius(value);
return this;
}
color(value){
if (value==null){
return this.text_e.color();
}
this.text_e.color(value);
return this;
}
styles(style_dict){
if (style_dict==null){
let styles=super.styles(null);
styles["--child-background"]=this.border_e.background();
styles["--child-border-width"]=this.border_e.padding();
styles["--child-border-radius"]=this.border_e.border_radius();
styles["--child-color"]=this.text_e.color();
styles["--child-background-image"]=this.text_e.style.backgroundImage;
styles["--child-background-clip"]=this.text_e.style.backgroundClip;
styles["--child-webkit-background-clip"]=this.text_e.style["-webkit-background-clip"];
return styles;
}else {
return super.styles(style_dict);
}
}
text(val){
if (val==null){return this.text_e.text();}
this.text_e.text(val);
return this;
}
transition_border_color(val){
if (val==null){return this.border_e.transition();}
this.border_e.transition(typeof val!=="string"?val:val.replace("border-color ","background "));
return this;
}
};function BorderButton(...args){return new BorderButtonElement(...args)};;vweb.elements.register(BorderButtonElement);
class LoaderButtonElement extends AnchorHStackElement{
static default_style={
...AnchorHStackElement.default_style,
"margin":"0px",
"padding":"12.5px 10px 12.5px 10px",
"border-radius":"25px",
"cursor":"pointer",
"background":"black",
"color":"inherit",
"font-size":"16px",
"user-select":"none",
"text-decoration":"none",
"--loader-width":"20px",
"--loader-height":"20px",
};
constructor(text="",loader=RingLoader){
super();
this.element_type="LoaderButton";
this.styles(LoaderButtonElement.default_style);
this.wrap(false);
this.center();
this.center_vertical()
this.loader=loader()
.frame(LoaderButtonElement.default_style["--loader-width"],LoaderButtonElement.default_style["--loader-height"])
.background("white")
.update()
.hide()
.parent(this)
this.text=VElement()
.text(text)
.margin(0)
.padding(0)
.parent(this);
this.append(this.loader, this.text);
}
styles(style_dict){
if (style_dict==null){
let styles=super.styles();
styles["--loader-width"]=this.loader.style.width||"20px";
styles["--loader-height"]=this.loader.style.height||"20px";
return styles;
}else {
return super.styles(style_dict);
}
}
set_default(){
return super.set_default(LoaderButtonElement);
}
show_loader(){
this.disable();
this.text.hide();
this.loader.update();
this.loader.show();
return this;
}
start(){return this.show_loader();}
hide_loader(){
this.enable();
this.loader.hide();
this.text.show();
return this;
}
stop(){return this.hide_loader();}
};function LoaderButton(...args){return new LoaderButtonElement(...args)};;vweb.elements.register(LoaderButtonElement);
class CanvasElement extends CreateVElementClass({
type:"Canvas",
tag:"canvas",
}){
constructor(){
super();
if (vweb.is_safari){
this.attachShadow({mode:'open'});
this._e=document.createElement("canvas");
this._e.style.objectFit="cover";
this.shadowRoot.appendChild(this._e);
this.position("relative");
this.overflow("hidden");
this.on_resize(()=>{
this._e.style.width=this.style.width;
this._e.width=this.width;
this._e.style.height=this.style.height;
this._e.height=this.height;
})
}
this.ctx_2d=this.getContext("2d");
}
height(value,check_attribute=true){
if (this._e===undefined){
return super.height(value,check_attribute);
}
if (value==null){
return this._e.height;
}
super.height(value, false);
this._e.style.height=this.pad_numeric(value,"px");
this._e.height=this.pad_numeric(value,"");
return this;
}
min_height(value){
if (this._e===undefined){
return super.min_height(value);
}
if (value==null){
return this._e.style.minHeight;
}
this._e.style.minHeight=this.pad_numeric(value,"px");
return this;
}
max_height(value){
if (this._e===undefined){
return super.max_height(value);
}
if (value==null){
return this._e.style.maxHeight;
}
this._e.style.maxHeight=this.pad_numeric(value,"px");
return this;
}
width(value,check_attribute=true){
if (this._e===undefined){
return super.width(value,check_attribute);
}
if (value==null){
return this._e.width;
}
super.width(value, false);
this._e.style.width=this.pad_numeric(value,"px");
this._e.width=value;
return this;
}
min_width(value){
if (this._e===undefined){
return super.min_width(value);
}
if (value==null){
return this._e.style.minWidth;
}
this._e.style.minWidth=this.pad_numeric(value,"px");
return this;
}
max_width(value){
if (this._e===undefined){
return super.max_width(value);
}
if (value==null){
return this._e.style.maxWidth;
}
this._e.style.maxWidth=this.pad_numeric(value,"px");
return this;
}
getContext(...args){
if (vweb.is_safari){
return this._e.getContext(...args);
}
return super.getContext(...args);
}
draw_lines(ctx,points=[{x:0,y:0}],tension=null){
ctx.beginPath();
ctx.moveTo(points[0].x,points[0].y);
let t;
for (let i=0;i<points.length-1;i++){
if (points[i].tension!=null){
t=points[i].tension;
}else {
t=(tension!=null)?tension:0;
}
let p0=(i>0)?points[i-1]:points[0];
let p1=points[i];
let p2=points[i+1];
let p3=(i!=points.length-2)?points[i+2]:p2;
let cp1x=p1.x+(p2.x-p0.x)/6*t;
let cp1y=p1.y+(p2.y-p0.y)/6*t;
let cp2x=p2.x-(p3.x-p1.x)/6*t;
let cp2y=p2.y-(p3.y-p1.y)/6*t;
ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,p2.x,p2.y);
}
}
create_gradient(ctx,gradient,start_x,start_y,end_x,end_y){
if (!(gradient instanceof GradientType)){
console.error("Invalid usage, parameter \"gradient\" should be type \"GradientType\".");
return null;
}
let value;
if (gradient.type=="linear"){
value=ctx.createLinearGradient(start_x,start_y,end_x,end_y)
}else if (gradient.type=="radial"){
value=ctx.createRadialGradient(start_x,start_y,end_x,end_y)
}else {
value=ctx.createLinearGradient(start_x,start_y,end_x,end_y)
}
for (let i=0;i<gradient.colors.length;i++){
let stop=gradient.colors[i].stop;
if (vweb.utils.is_string(stop)&&stop.includes("%")){
stop=parseFloat(stop.substr(0,stop.length-1))/100;
}else if (vweb.utils.is_string(stop)&&stop.includes("px")){
stop=parseFloat(stop.substr(0,stop.length-2));
}
value.addColorStop(stop,gradient.colors[i].color);
}
return value;
}
lines({
points=[{x:0,y:0}],
tension=null,
color="black",
width=null,
fill=null,
scale=false,
dots=null,
}){
let ctx=this.ctx_2d;
if (scale){
const width=this.width();
const height=this.height();
for (let i=0;i<points.length;i++){
points[i].x=width*points[i].x;
points[i].y=height*points[i].y;
}
}
this.draw_lines(ctx,points,tension);
if (width!=null){
ctx.lineWidth=width;
}
if (color!=null){
ctx.strokeStyle=color;
}else {
ctx.strokeStyle="transparent";
}
ctx.stroke();
if (fill!=null){
if (fill instanceof GradientType){
let minX=Infinity;
let maxX=-Infinity;
let minY=Infinity;
let maxY=-Infinity;
points.forEach((point)=>{
minX=Math.min(minX,point.x);
maxX=Math.max(maxX,point.x);
minY=Math.min(minY,point.y);
maxY=Math.max(maxY,point.y);
});
ctx.fillStyle=this.create_gradient(ctx,fill,minX,minY,maxX,maxY);
}
else {
ctx.fillStyle=fill;
}
ctx.fill();
}
if (dots!=null){
if (dots.width==null){
if (scale){
dots.width=0.01;
}else {
dots.width=5;
}
}
if (scale){
dots.width=dots.width*this.width();
}
let is_gradient=false;
if (dots.color!=null){
if (dots.color instanceof GradientType){
is_gradient=true;
}else {
ctx.fillStyle=dots.color;
}
}
for (let i=0;i<points.length;i++){
ctx.beginPath();
ctx.arc(points[i].x,points[i].y,dots.width,0,2*Math.PI);
if (is_gradient){
const gradient=this.create_gradient(ctx,dots.color,points[i].x-dots.width,points[i].y,points[i].x+dots.width,points[i].y);
ctx.fillStyle=gradient;
}
ctx.fill();
}
}
return this;
}
clear(){
this.ctx_2d.clearRect(0,0, this.width, this.height);
return this;
}
shadow_color(val){
if (val===undefined){return this.ctx_2d.shadowColor;}
this.ctx_2d.shadowColor=val;
return this;
}
shadow_blur(val){
if (val===undefined){return this.ctx_2d.shadowBlur;}
this.ctx_2d.shadowBlur=val;
return this;
}
shadow_offset_x(val){
if (val===undefined){return this.ctx_2d.shadowOffsetX;}
this.ctx_2d.shadowOffsetX=val;
return this;
}
shadow_offset_y(val){
if (val===undefined){return this.ctx_2d.shadowOffsetY;}
this.ctx_2d.shadowOffsetY=val;
return this;
}
};function Canvas(...args){return new CanvasElement(...args)};;vweb.elements.register(CanvasElement);;
class CheckBoxElement extends VStackElement{
static default_style={
...VStackElement.default_style,
"color":"inherit",
"font-size":"16px",
"--circle-border-color":"gray",
"--circle-inner-bg":"#FFFFFF",
"--focus-color":"#8EB8EB",
"--missing-color":"#E8454E",
};
constructor(text_or_obj={
text:"",
required:false,
id:null,
}){
let text=text_or_obj,required=false,id=null;
if (typeof text_or_obj==="object"&&text_or_obj!==null){
text=text_or_obj.text;
required=text_or_obj.required==null?false :text_or_obj.required;
id=text_or_obj.id==null?null :text_or_obj.id;
}
super();
this.element_type="CheckBox";
this._border_color=CheckBoxElement.default_style["--circle-border-color"];
this._inner_bg=CheckBoxElement.default_style["--circle-inner-bg"];
this._focus_color=CheckBoxElement.default_style["--focus-color"];
this._missing_color=CheckBoxElement.default_style["--missing-color"];
this._missing=false;
this.styles(CheckBoxElement.default_style);
const _this=this;
this.circle=VStack(
VStack()
.assign_to_parent_as("inner")
.border_radius("50%")
.frame("35%","35%")
.background(this._inner_bg)
.flex_shrink(0)
)
.assign_to_parent_as("circle")
.flex_shrink(0)
.border_width(1)
.border_style("solid")
.border_color(this._border_color)
.border_radius("50%")
.frame(15,15)
.margin(2.5,10,0,0)
.background("transparent")
.box_shadow(`0 0 0 0px transparent`)
.transition("background 0.3s ease-in-out, box-shadow 0.2s ease-in-out")
.center()
.center_vertical()
.on_mouse_over((e)=>e.box_shadow(`0 0 0 2px ${this._focus_color}`))
.on_mouse_out((e)=>e.box_shadow(`0 0 0 0px transparent`))
.on_click((e)=>e.toggle())
.extend({
enabled:false,
toggle:function(){
return this.value(!this.enabled);
},
value:function(to=null){
if (to==null){return this.enabled;}
else if (to===true){
this.enabled=true;
this.background(_this._focus_color);
_this.missing(false);
}else {
this.enabled=false;
this.background("transparent");
}
return this;
},
})
this.text=Text()
.inner_html(text)
.font_size("inherit")
.color("inherit")
.padding(0)
.margin(0)
this.content=HStack(this.circle, this.text)
.width("100%")
this.error=Text("Incomplete field")
.color(this._missing_color)
.font_size("0.8em")
.margin(5,0,0,2.5)
.padding(0)
.hide()
this.append(this.content, this.error);
if (id!=null){
this.id(id);
}
if (required){
this.required(required);
}
}
border_color(val){
if (val==null){return this._border_color;}
this._border_color=val;
this.circle.border_color(this._border_color);
return this;
}
inner_bg(val){
if (val==null){return this._inner_bg;}
this._inner_bg=val;
this.circle.inner.background(this._inner_bg);
return this;
}
styles(style_dict){
if (style_dict==null){
let styles=super.styles();
styles["--circle-inner-bg"]=this._inner_bg;
styles["--circle-border-color"]=this._border_color;
styles["--focus-color"]=this._focus_color;
styles["--missing-color"]=this._missing_color;
return styles;
}else {
return super.styles(style_dict);
}
}
set_default(){
return super.set_default(ExtendedInputElement);
}
toggle(){
this.circle.toggle();
return this;
}
value(to=null){
if (to==null){return this.circle.enabled;}
this.circle.value(to);
return this;
}
required(to=null){
if (to==null){return this._required;}
this._required=to;
return this;
}
focus_color(val){
if (val==null){return this._focus_color;}
this._focus_color=val;
return this;
}
missing_color(val){
if (val==null){return this._missing_color;}
this._missing_color=val;
return this;
}
missing(to=true){
if (to==null){return this._missing;}
else if (to===true){
this._missing=true;
this.circle.outline(`1px solid ${this._missing_color}`)
this.circle.box_shadow(`0 0 0 3px ${this._missing_color}80`)
this.error.color(this._missing_color);
this.error.show();
}else {
this._missing=false;
this.circle.outline("0px solid transparent")
this.circle.box_shadow(`0 0 0 0px transparent`)
this.error.hide();
}
return this;
}
submit(){
const value=this.value();
if (value!==true){
this.missing(true);
throw Error("Fill in all the required fields.");
}
this.missing(false);
return value;
}
};function CheckBox(...args){return new CheckBoxElement(...args)};;vweb.elements.register(CheckBoxElement);
vweb.elements.language_codeblocks=[];
class CodeBlockElement extends CreateVElementClass({
type:"CodeBlock",
tag:"code",
default_style:{
"display":"flex",
"flex-direction":"column",
"margin":"0px 0px 0px 0px",
"padding":"15px 20px 15px 20px",
"color":"inherit",
"text-align":"start",
"white-space":"pre",
"font-family":"'Menlo', 'Consolas', monospace",
"font-size":"13px",
"font-weight":"500",
"line-height":"18px",
"border-radius":"15px",
"color":"#FFFFFF",
"background":"#262F3D",
"overflow":"hidden",
"width":"100%",
"min-width":"100%",
"--header-color":"inherit",
"--header-border":"#00000010",
"--header-background":"inherit",
"--selected-language-color":"inherit",
},
}){
constructor(code_or_opts={
code:"",
language:null,
line_numbers:false,
line_divider:true,
animate:false,
delay:25,
duration:null,
already_highlighted:false,
opts:{},
}){
super();
let code=code_or_opts;
this.language=null;
this.line_numbers=false;
this.line_divider=true;
this.animate=false
this.delay=25
this.duration=null
this.already_highlighted=false;
this.opts={};
if (typeof code_or_opts==="object"){
if (code_or_opts.code!==undefined){code=code_or_opts.code;}
if (code_or_opts.language!==undefined){this.language=code_or_opts.language;}
if (code_or_opts.line_numbers!==undefined){this.line_numbers=code_or_opts.line_numbers;}
if (code_or_opts.line_divider!==undefined){this.line_divider=code_or_opts.line_divider;}
if (code_or_opts.already_highlighted!==undefined){this.already_highlighted=code_or_opts.already_highlighted;}
if (code_or_opts.animate!==undefined){this.animate=code_or_opts.animate;}
if (code_or_opts.delay!==undefined){this.delay=code_or_opts.delay;}
if (code_or_opts.duration!==undefined){this.duration=code_or_opts.duration;}
if (code_or_opts.opts!==undefined){this.opts=code_or_opts.opts;}
}
if (typeof code==="object"){
this.languages=Object.keys(code);
this.languages_code=code;
this.languages.iterate((lang)=>{
this.languages_code[lang]=this.languages_code[lang].trim();
})
}else {
code=code.trim();
}
if (this.languages!==undefined){
const code_pres={};
const opacity_duration=100;
const height_duration=400;
const lang_font_size=10;
const _this=this;
this._selected_language_color=CodeBlockElement.default_style["--selected-language-color"];
this._header_color=CodeBlockElement.default_style["--header-color"];
this._header_border=CodeBlockElement.default_style["--header-border"];
this._header_background=CodeBlockElement.default_style["--header-background"];
let background=this._header_background;
if (this._header_background==null||this._header_background==="inherit"){
this._header_background="inherit";
background=this.background();
}
let header_color=this._header_color;
if (this._header_color==null||this._header_color==="inherit"){
header_color=this.color();
}
this.clipboard=ImageMask("https://raw.githubusercontent.com/vandenberghinc/public-storage/master/libris/copy.png")
.parent(this)
.frame(15,15)
.flex_shrink(0)
.margin(null, null, null,10)
.mask_color(header_color)
.transform("rotate(90deg)")
.hover_brightness(0.8,0.9)
.on_click(async ()=>{
vweb.utils.copy_to_clipboard(_this.pre.textContent)
.then(()=>{
})
.catch((error)=>{
console.error(error);
})
});
this.arrow=ImageMask("https://raw.githubusercontent.com/vandenberghinc/public-storage/master/libris/arrow.png")
.parent(this)
.frame(8,8)
.flex_shrink(0)
.mask_color(header_color)
.transform("rotate(90deg)")
.parent(this);
this.header=HStack(
Span("")
.font_size(12)
.line_height(12)
.font_weight("bold")
.assign_to_parent_as("title")
.color("inherit")
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
this.clipboard,
VStack(
HStack(
Span()
.color("inherit")
.margin_right(5)
.font_size(lang_font_size)
.line_height(lang_font_size)
.assign_to_parent_as("value"),
this.arrow,
)
.opacity(1)
.center_vertical()
.transition(`opacity ${opacity_duration}ms ease-in-out`)
.center()
.hover_brightness(0.8,0.9)
.on_click(()=>{
this.header.popup()
})
.assign_to_parent_as("minimized"),
VStack()
.opacity(0)
.max_height(lang_font_size)
.max_width("none")
.width("100%")
.center()
.overflow("hidden")
.transition(`max-height ${height_duration}ms ease-in-out, max-width ${height_duration}ms ease-in-out, opacity ${opacity_duration}ms ease-in-out`)
.assign_to_parent_as("maximized"),
)
.position(7.5,7.5, null, null)
.center_vertical()
.padding(7.5,10)
.border_radius(15)
.border(1, this._header_border)
.background(background)
.z_index(2)
.transition(`min-width ${height_duration}ms ease-in-out`)
.assign_to_parent_as("content")
)
.parent(this)
.position("relative")
.color(this._header_color)
.height(42.5)
.padding(7.5,15)
.center_vertical()
.z_index(2)
.border_bottom(`1px solid ${this._header_border}`)
.background(background)
.extend({
selected:null,
set_selected:function(val){
const minimized=this.content.minimized;
const maximized=this.content.maximized;
minimized.value.text(val);
this.title.text(val)
this.selected=val;
_this.language=val;
if (maximized.max_width()==="none"){
const width_measurer=document.createElement("canvas").getContext("2d");
width_measurer.font=window.getComputedStyle(minimized.value).font;
const initial_width=width_measurer.measureText(this.selected).width;
maximized.max_width(initial_width+10+10+7.5*2);
}
},
close_handler:function(event){
_this.header.close_popup();
},
close_popup:function(){
const minimized=this.content.minimized;
const maximized=this.content.maximized;
const width_measurer=document.createElement("canvas").getContext("2d");
width_measurer.font=window.getComputedStyle(minimized.value).font;
const width=width_measurer.measureText(minimized.value.textContent).width;
maximized.max_height(lang_font_size);
maximized.max_width(width+10+10);
setTimeout(()=>{
minimized.show()
setTimeout(()=>{
this.content.min_width(0)
minimized.opacity(1)
},25);
},height_duration-opacity_duration-25+125)
setTimeout(()=>{
maximized.opacity(0)
},height_duration-opacity_duration-200)
setTimeout(()=>{
maximized.inner_html("");
},height_duration)
window.removeEventListener("mousedown", this.close_handler);
},
popup:function(){
const minimized=this.content.minimized;
const maximized=this.content.maximized;
if (parseFloat(maximized.max_height())!==lang_font_size){
return null;
}
maximized.inner_html("");
const stack=VStack()
.padding(0,10)
maximized.append(stack)
let height=0;
let width=0;
_this.languages.iterate((lang)=>{
const span=Span(lang)
.color(lang===this.selected?_this._selected_language_color:_this._header_color)
.font_size(lang_font_size+1)
.line_height(lang_font_size+1)
.margin(6,0,6,0)
.on_click(()=>{
this.select(lang)
this.close_popup();
})
stack.append(span);
width=Math.max(width,span.clientWidth);
height+=(lang_font_size+1)+6*2;
});
width+=20;
window.addEventListener("mousedown", this.close_handler);
minimized.hide()
maximized.max_width(width);
maximized.max_height(height);
setTimeout(()=>maximized.opacity(1),100);
},
select:function (id,recursive=true){
if (recursive){
localStorage.setItem("vweb_code_lang",id);
vweb.elements.language_codeblocks.iterate((item)=>item.header.select(id, false))
}else {
if (_this.languages.includes(id)===false){
return ;
}
this.set_selected(id);
_this.languages.iterate((lang)=>{
if (lang===id){
if (_this.already_highlighted){
_this.pre.innerHTML=_this.languages_code[lang];
}else {
_this.highlight({
code:_this.languages_code[lang],
language:lang,
animate:_this.animate,
delay:_this.delay,
duration:_this.duration,
opts:_this.opts,
})
}
return true;
}
})
}
}
})
vweb.elements.language_codeblocks.push(this);
}
if (this.languages!==undefined){
const def=localStorage.getItem("vweb_code_lang");
if (this.languages.includes(def)){
code=this.languages_code[def];
this.language=def;
}else {
code=this.languages_code[this.languages[0]];
this.language=this.languages[0];
}
}
this.pre=CodePre(code)
.parent(this)
.color("inherit")
.font("inherit")
.background("none")
.border_radius(0)
.padding(0)
.margin(0)
.stretch(true)
.overflow("visible")
.line_height("inherit")
this.lines=VElement()
.parent(this)
.color("var(--vhighlight-token-comment)")
.font("inherit")
.white_space("pre")
.line_height("inherit")
.flex_shrink(0)
.hide()
this.lines_divider=VElement()
.parent(this)
.background("var(--vhighlight-token-comment)")
.fixed_width(0.5)
.flex_shrink(0)
.fixed_height("calc(100% - 6px)")
.margin(3,10,0,10)
.hide()
this.content=HStack(this.lines, this.lines_divider, this.pre)
.parent(this)
.padding(CodeBlockElement.default_style.padding)
.flex_wrap("nowrap")
.overflow("auto visible")
this.append(
this.header,
this.content,
);
this.padding(0)
if (this.languages!==undefined){
this.header.select(this.language, false);
}
}
hide_scrollbar(){
this.content.classList.add("hide_scrollbar");
return this;
}
show_scrollbar(){
this.content.classList.remove("hide_scrollbar");
return this;
}
styles(style_dict){
if (style_dict==null){
let styles=super.styles();
styles["--header-color"]=this._header_color;
styles["--header-border"]=this._header_border;
styles["--header-background"]=this._header_background;
styles["--selected-language-color"]=this._selected_language_color;
return styles;
}else {
return super.styles(style_dict);
}
}
show(){
this.style.display="flex";
return this;
}
select(language){
if (this.languages===undefined){
throw Error("This function is only allowed when the code block was defined with different code per language.");
}
this.header.select(language);
return this;
}
selected(){
return this.language;
}
selected_language_color(value){
if (value===null){
return this._selected_language_color;
}
this._selected_language_color=value;
return this;
}
header_color(value){
if (value===null){
return this._header_color;
}
this._header_color=value;
if (this.header!==undefined){
this.clipboard.mask_color(this._header_color)
this.arrow.mask_color(this._header_color)
this.header.color(this._header_color)
}
return this;
}
header_border_color(value){
if (value===null){
return this._header_border;
}
this._header_border=value;
if (this.header!==undefined){
this.header.content.border(1, this._header_border)
this.header.border_bottom(`1px solid ${this._header_border}`)
}
return this;
}
header_background(value){
if (value===null){
return this._header_background;
}
this._header_background=value;
if (this.header!==undefined){
this.header.background(this._header_background)
this.header.content.background(this._header_background)
}
return this;
}
highlight({
code=null,
language=null,
line_numbers=null,
line_divider=null,
animate=null,
delay=null,
duration=null,
opts=null,
}={}){
if (language==null){language=this.language;}
if (line_numbers==null){line_numbers=this.line_numbers;}
if (line_divider==null){line_divider=this.line_divider;}
if (animate==null){animate=this.animate;}
if (delay==null){delay=this.delay;}
if (duration==null){duration=this.duration;}
if (opts==null){opts=this.opts;}
this.pre.highlight({
code:code,
language:language,
animate:animate,
delay:delay,
duration:duration,
opts:opts,
_post_tokenized_callback:!line_numbers?null:(tokens)=>{
this.lines.show();
this.lines_divider.show();
if (line_divider){
this.lines_divider.fixed_width(1);
this.lines_divider.margin(3,10,0,10)
}else {
this.lines_divider.fixed_width(0);
this.lines_divider.margin(3,12.5,0,12.5)
}
let html="";
for (var i=0;i<tokens.length;i++){
html+=`${(i+1)}\n`;
}
this.lines.innerHTML=html;
this.lines_divider.min_height(this.lines.offsetHeight-6)
},
})
return this;
}
};function CodeBlock(...args){return new CodeBlockElement(...args)};;vweb.elements.register(CodeBlockElement);
class CodePreElement extends CreateVElementClass({
type:"CodePre",
tag:"pre",
default_style:{
"margin":"0px 0px 0px 0px",
"padding":"15px 20px 15px 20px",
"color":"inherit",
"text-align":"start",
"white-space":"pre",
"font-family":"'Menlo', 'Consolas', monospace",
"font-size":"13px",
"font-weight":"500",
"line-height":"16px",
"border-radius":"15px",
"color":"#FFFFFF",
"background":"#262F3D",
"tab-size":4,
"overflow":"scroll visible",
},
}){
constructor(code){
super();
this.code=code;
this.tokens=null;
if (this.code!=null){
while (this.code.length>0&&this.code[this.code.length-1]=="\n"){
this.code=this.code.slice(-this.code.length,-1);
}
this.text(this.code);
}
}
async animate_writing({code=null,delay=25,duration=null}={}){
if (code==null){
throw Error(`The code must be highlighted first using "highlight()".`)
}
await this.cancel_animation();
this.innerHTML="";
this.allow_animation=true;
this.animate_promise=new Promise((resolve)=>{
if (duration!=null){
delay=duration/code.length;
}
const computed=window.getComputedStyle(this);
this.style.minHeight=`${parseFloat(computed.paddingTop)+parseFloat(computed.paddingBottom)+parseFloat(computed.lineHeight)*this.tokens.length}px`;
this.innerHTML="";
const check_html_entity=(index)=>{
let entity="&",entity_last_index;
for (let i=index+1;i<index+1+5;i++){
entity+=code.charAt(i);
if (code.charAt(i)===";"){
entity_last_index=i;
break;
}
}
return {entity,entity_last_index};
}
const add_char=(index)=>{
if (this.allow_animation!==true){
return resolve()
}
else if (index>=code.length){
return resolve()
}
else {
if (code.charAt(index)==='<'){
let span_index;
let span_open="";
let span_close="";
let span_code="";
let open=true;
let first=true;
let recursive=false;
for (span_index=index;span_index<code.length;span_index++){
if (this.allow_animation!==true){
return ;
}
let char=code.charAt(span_index);
if (char==="&"){
let {entity,entity_last_index}=check_html_entity(span_index)
if (entity_last_index!==undefined){
char=entity;
span_index=entity_last_index;
}
}
if (char=='<'||open){
open=true;
if (first){
span_open+=char;
}else {
span_close+=char;
}
if (char=='>'){
open=false;
if (first){
first=false;
continue;
}
let before=this.innerHTML;
let added_span_code="";
const add_span_code=(index)=>{
if (index<span_code.length){
added_span_code+=span_code[index]
let add=before;
add+=span_open;
add+=added_span_code;
add+=span_close;
this.innerHTML=add;
setTimeout(()=>add_span_code(index+1),delay);
}else {
recursive=true;
setTimeout(()=>add_char(span_index+1),delay);
}
}
add_span_code(0)
break;
}
}
else {
span_code+=char;
}
}
if (recursive===false&&span_index===code.length){
resolve()
}
}
else {
let char=code.charAt(index);
if (char==="&"){
let {entity,entity_last_index}=check_html_entity(index)
if (entity_last_index!==undefined){
char=entity;
index=entity_last_index;
}
}
this.innerHTML+=char;
setTimeout(()=>add_char(index+1),delay);
}
}
}
add_char(0);
})
return this.promise;
}
async cancel_animation(){
if (this.animate_promise!=null){
this.allow_animation=false;
await this.animate_promise;
this.animate_promise=null;
}
}
highlight({
code=null,
language=null,
animate=false,
delay=25,
duration=null,
opts={},
_post_tokenized_callback=null,
}={}){
if (code!=null){
this.code=code;
while (this.code.length>0&&this.code[this.code.length-1]=="\n"){
this.code=this.code.slice(-this.code.length,-1);
}
this.innerHTML=code;
}
if (language!=null){
this.language=language;
}
if (this.language===""||this.language==null){
return this;
}
this.cancel_animation()
.then(()=>{
this.tokenizer=vhighlight.init_tokenizer(this.language,opts);
if (this.tokenizer==null){
return this;
}
this.tokenizer.code=this.code;
this.tokens=this.tokenizer.tokenize();
const highlighted_code=this.tokenizer.build_html(this.tokens);
if (_post_tokenized_callback!=null){
_post_tokenized_callback(this.tokens);
}
if (animate==true){
this.animate_writing({code:highlighted_code,delay,duration})
}else {
this.innerHTML=highlighted_code;
}
})
return this;
}
};function CodePre(...args){return new CodePreElement(...args)};;vweb.elements.register(CodePreElement);
class CodeLineElement extends CreateVElementClass({
type:"CodeLine",
tag:"span",
default_style:{
"font-family":"\"Menlo\", \"Consolas\", monospace",
"font-size":"0.90em",
"font-style":"italic",
"background":"#000000",
"color":"#FFFFFF",
"border-radius":"10px",
"white-space":"pre",
"padding":"2.5px 7.5px 2.5px 7.5px",
},
}){
constructor(text){
super();
this.inner_html(text);
}
static fill(text,codeline_callback=()=>CodeLine()){
if (text.indexOf("`")!==-1){
const split=text.split("`");
let is_code=false;
let filled="";
for (let i=0;i<split.length;i++){
if (is_code){
filled+=codeline_callback().text(split[i]);
}else {
filled+=split[i];
}
is_code=!is_code;
}
text=filled;
}
return text;
}
};function CodeLine(...args){return new CodeLineElement(...args)};;vweb.elements.register(CodeLineElement);
class MultiLanguageCodeBlockElement extends VStackElement{
static default_style={
...VStackElement.default_style,
"font-family":"'Menlo', 'Consolas', monospace",
"background":"black",
"color":"white",
"box-shadow":"0px 0px 5px #00000005",
"font-size":"13px",
"line-height":"18px",
"border-radius":"10px",
"tab-size":4,
"--mlcb-tint":"white",
"--mlcb-div-bg":"grey",
"--mlcb-title-opac":0.7,
};
constructor({content,highlight=true}){
super();
this.element_type="Steps";
this.styles(StepsElement.default_style);
if (content===undefined&&arguments.length===1){
content=arguments[0];
}
let code=content;
if (typeof code==="string"){
code={language:"__unknown__",title:null,data:code};
}
else if (typeof code==="object"&&!Array.isArray(code)){
code=[code];
}else if (!Array.isArray(code)){
console.error(`Invalid value type of code block "${typeof code}".`)
}
const main_this=this;
this._fg=MultiLanguageCodeBlockElement.default_style.color;
this._tint=MultiLanguageCodeBlockElement.default_style["--mlcb-tint"];
this._div_bg=MultiLanguageCodeBlockElement.default_style["--mlcb-div-bg"];
this._title_opac=MultiLanguageCodeBlockElement.default_style["--mlcb-title-opac"];
this._pre_nodes=[];
this._title_nodes=[];
this.header=HStack(
HStack(
ForEach(code,(item,index)=>{
const title=VStack(
Span(item.title||item.language||"")
.font_size(12)
.line_height(12+2)
.font_weight(500)
.ellipsis_overflow(true),
VStack()
.width("100%")
.height(2)
.border_radius(2)
.transition("background 300ms ease-in-out")
.background("transparent")
.assign_to_parent_as("divider")
.position(null, null,0, null)
)
.transition("opacity 300ms ease-in-out")
.opacity(this._title_opac)
.padding(0,2)
.flex_shrink(0)
.center_vertical()
.height("100%")
.position("relative")
.margin_right(20)
.on_mouse_over(()=>{
if (this.header.selected!==index){
title.opacity(1);
title.divider.opacity(this._title_opac).background(this._fg);
}
})
.on_mouse_out(()=>{
if (this.header.selected!==index){
title.opacity(this._title_opac);
title.divider.opacity(1).background("transparent");
}
})
if (code.length>1){
title.on_click(()=>this.header.select(index))
}
this._title_nodes.append(title);
return title;
}),
)
.parent(this)
.height("100%")
.class("hide_scrollbar")
.wrap(false)
.overflow("visible")
.width("100%"),
code.length>1?null :Spacer(),
this._copy_img=ImageMask("/vweb_static/icons/copy.webp")
.frame(15,15)
.flex_shrink(0)
.margin(null, null, null,10)
.mask_color(this._fg)
.transform("rotate(90deg)")
.opacity(this._title_opac)
.transition("opacity 250ms ease-in-out")
.on_mouse_over(e=>e.opacity(1))
.on_mouse_out(e=>e.opacity(this._title_opac))
.on_click(async ()=>{
vweb.utils.copy_to_clipboard(this.header.selected_code_pre.textContent)
.then(()=>{
if (typeof RESPONSE_STATUS!=="undefined"){
RESPONSE_STATUS.message("Copied to clipboard");
}
})
.catch((error)=>{
console.error(error);
if (typeof RESPONSE_STATUS!=="undefined"){
RESPONSE_STATUS.error("Failed to the code to the clipboard");
}
})
}),
)
.width("100%")
.overflow("hidden")
.height(42.5)
.padding(0,15,0,15)
.center_vertical()
.z_index(2)
.extend({
selected:null,
selected_lang:null,
selected_code_pre:null,
set_selected:function(index){
this.selected=index;
this.selected_lang=code[index].language||"__unknown__";
this.selected_code_pre=main_this._pre_nodes[index];
main_this._title_nodes.iterate((i)=>{
i.opacity(main_this._title_opac)
if (code.length>1){
i.divider
.opacity(1)
.background("transparent")
.remove_on_theme_updates()
}
});
main_this._title_nodes[index].opacity(1)
if (code.length>1){
main_this._title_nodes[index].divider.background(main_this._tint)
}
},
select:function (lang_or_index,recursive=true){
let lang;
let index;
if (typeof lang_or_index==="string"){
for (let i=0;i<code.length;i++){
if (code[i].language===lang_or_index){
lang=lang_or_index;
index=i;
break;
}
}
if (index===undefined){
return ;
}
}else {
if (lang_or_index>=code.length){return ;}
index=lang_or_index;
lang=code[index].language||"__unknown__";
}
if (recursive&&lang!=="__unknown__"){
this.select(index, false);
}else {
this.set_selected(index);
for (let i=0;i<main_this._pre_nodes.length;i++){
if (i===index){
main_this._pre_nodes[i].show();
}else {
main_this._pre_nodes[i].hide();
}
}
}
}
})
this.content=HStack()
.width("100%")
.overflow("scroll")
let index=0;
code.iterate((item)=>{
if (item.data==null){
console.error("Undefined codeblock data"+(item.language==="__unknown__"?"":` for language ${item.language}`)+".");
return null;
}
if (highlight){
const tokenizer=vhighlight.init_tokenizer(item.language);
if (tokenizer){
item.data=tokenizer.tokenize({code:item.data,build_html:true});
}
}
const pre=CodePre()
.padding(20,20)
.margin(0)
.inner_html(item.data)
.overflow("visible")
.background("transparent")
.border_radius(0)
.stretch(true);
pre.hide();
this._pre_nodes.append(pre);
this.content.append(pre);
++index;
})
this
.display("block")
.white_space("pre")
.class("hide_scrollbar")
.max_width("100%")
.border(1, this._div_bg)
.position("relative")
.append(
this.header,
this.divider=Divider()
.parent(this)
.background(this._div_bg)
.margin(0,0,0,0),
this.content,
)
this.header.select(0, false);
}
set_default(){
return super.set_default(TabsElement);
}
styles(style_dict){
if (style_dict==null){
let styles=super.styles();
styles["--mlcb-tint"]=this._tint;
styles["--mlcb-div-bg"]=this._div_bg;
styles["--mlcb-title-opac"]=this._title_opac;
return styles;
}else {
return super.styles(style_dict);
}
}
color(value){
if (value==null){return this._fg;}
this._fg=value;
super.color(value);
this._copy_img.mask_color(value);
return this;
}
tint(value){
if (value==null){return this._tint;}
this._tint=value;
this.header.set_selected(this.header.selected);
return this;
}
divider_background(value){
if (value==null){return this._div_bg;}
this._div_bg=value;
this.divider.background(value);
return this;
}
};function MultiLanguageCodeBlock(...args){return new MultiLanguageCodeBlockElement(...args)};;vweb.elements.register(MultiLanguageCodeBlockElement);
vweb.colors={};
vweb.colors.hex={
get_brightness(color){
color=color.replace(/^#/,'');
const bigint=parseInt(color,16);
const r=(bigint>>16)&255;
const g=(bigint>>8)&255;
const b=bigint&255;
const brightness=(0.299*r+0.587*g+0.114*b)/255;
return brightness;
},
to_rgb(hex,as_array=false){
const index=hex.indexOf("#")
if (index!==-1){
hex=hex.substr(index+1);
}
let r=parseInt(hex.substring(0,2),16);
let g=parseInt(hex.substring(2,4),16);
let b=parseInt(hex.substring(4,6),16);
let a=1;
if (hex.length>6){
a=parseInt(hex.substring(6,8),16)/255;
}
if (as_array){
return [r,g,b,a];
}
return {r,g,b,a};
},
adjust_brightness(color,adjust=0){
const rgba=this.to_rgb(color);
rgba.r+=adjust;
rgba.g+=adjust;
rgba.b+=adjust;
return vweb.colors.rgba.to_hex(rgba.r,rgba.g,rgba.b,rgba.a);
},
}
vweb.colors.hex.to_rgba=vweb.colors.hex.to_rgb;
vweb.colors.rgb={
to_hex(r,g,b,a=1){
let hexR=parseInt(r).toString(16).padStart(2,'0');
let hexG=parseInt(g).toString(16).padStart(2,'0');
let hexB=parseInt(b).toString(16).padStart(2,'0');
let hexA=a==1?"":Math.round(a*255).toString(16).padStart(2,'0');
return `#${hexR}${hexG}${hexB}${hexA}`;
},
to_obj(color){
if (!color.startsWith("rgba(")&&!color.startsWith("rgb(")){
throw new Error("Invalid color format");
}
const split=color.trim().split("(")[1].slice(0,-1).color.split(",")
const obj={r:null,g:null,b:null,a:1};
const keys=Object.keys(obj);
for (let i=0;i<split.length;i++){
if (i===3){
obj[keys[i]]=parseFloat(split[i].trim());
}else {
obj[keys[i]]=parseInt(split[i].trim());
}
}
return obj;
},
to_str(r,g,b,a=1){
if (a!==1){
return `rgba(${r}, ${g}, ${b}, ${a})`;
}else {
return `rgb(${r}, ${g}, ${b})`;
}
},
adjust_brightness(color,adjust=0){
const rgba=this.to_obj(color);
rgba.r+=adjust;
rgba.g+=adjust;
rgba.b+=adjust;
return this.to_str(rgba.r,rgba.g,rgba.b,rgba.a);
},
}
vweb.colors.rgba=vweb.colors.rgb;
vweb.colors.adjust_brightness=(color,adjust=0)=>{
if (color.startsWith("rgb")){
return vweb.colors.rgb.adjust_brightness(color,adjust);
}else if (color.startsWith("#")){
return vweb.colors.hex.adjust_brightness(color,adjust);
}else {
throw new Error("Invalid color format");
}
}
vweb.colors.set_opacity=(color,opacity=1.0)=>{
let rgb,type;
if (color.startsWith("rgb")){
type="rgb";
rgb=vweb.colors.rgb.to_obj(color);
}else if (color.startsWith("#")){
type="hex";
rgb=vweb.colors.hex.to_rgb(color);
}else {
throw new Error("Invalid color format");
}
rgb.a=opacity;
if (false&&type==="hex"){
return vweb.colors.rgb.to_hex(rgb.r,rgb.g,rgb.b,rgb.a);
}else {
return vweb.colors.rgb.to_str(rgb.r,rgb.g,rgb.b,rgb.a);
}
}
class ColorRangeClass{
constructor(start,end){
if (Array.isArray(start)){
this.start=this.array_to_rgba(start);
}else if (typeof start==="string"){
this.start=vweb.colors.hex.to_rgb(start);
}else {
throw new Error(`Invalid type "${typeof start}" for parameter "start", the valid types are "string" or "array".`);
}
if (Array.isArray(end)){
this.end=this.array_to_rgba(end);
}else if (typeof end==="string"){
this.end=vweb.colors.hex.to_rgb(end);
}else {
throw new Error(`Invalid type "${typeof end}" for parameter "end", the valid types are "string" or "array".`);
}
}
array_to_rgba(array){
return {
r:array[0],
g:array[1],
b:array[2],
a:array.length===3?[3]:1,
}
}
interpolate(percent=0.5,alpha=1.0){
if (percent<=0){
return vweb.colors.rgb.to_str(
this.start.r,
this.start.g,
this.start.b,
this.start.a,
)
}else if (percent>=1){
return vweb.colors.rgb.to_str(
this.end.r,
this.end.g,
this.end.b,
this.end.a,
)
}
return vweb.colors.rgba.to_str(
Math.round(this.start.r+(this.end.r-this.start.r)*percent),
Math.round(this.start.g+(this.end.g-this.start.g)*percent),
Math.round(this.start.b+(this.end.b-this.start.b)*percent),
alpha,
)
}
};function ColorRange(...args){return new ColorRangeClass(...args)};
class ContextMenuElement extends VStackElement{
constructor(content){
super();
this.element_type="ContextMenu";
content.iterate((item)=>{
if (item==null){
return null;
}
else if (typeof item==="object"){
const button=Button(item.label)
.padding(5,10,5,10)
.margin(0)
.font_size(12)
.leading()
.background("#FFFFFF15")
.border_radius(0)
if (typeof item.on_click==="function"){
button.on_click((element,event)=>item.on_click(element,event, this));
}
if (typeof item.on_render==="function"){
button.on_render((element)=>item.on_render(element));
}
this.append(button);
}else {
this.append(item);
}
})
this
.z_index(2)
.padding(5,0,5,0)
.color("white")
.background("gray")
.box_shadow("0px 0px 10px #00000050")
.border_radius(10)
.min_width(150)
this.remove_child_callback=()=>{
if (!this.contains(event.target)){
this.remove();
}
document.body.removeEventListener("mousedown", this.remove_child_callback);
}
}
set_default(){
return super.set_default(ContextMenuElement);
}
popup(event){
event.preventDefault();
super.show();
this.position(event.clientY, null, null,event.clientX)
document.body.appendChild(this);
document.body.addEventListener("mousedown", this.remove_child_callback);
}
close(){
super.remove();
document.body.removeEventListener("mousedown", this.remove_child_callback);
}
remove(){
super.remove();
document.body.removeEventListener("mousedown", this.remove_child_callback);
}
};function ContextMenu(...args){return new ContextMenuElement(...args)};;vweb.elements.register(ContextMenuElement);
class CSSElement{
constructor(data,auto_append=true){
this._element=document.createElement("style");
this._element.innerHTML=data;
if (auto_append){
document.head.appendChild(this._element);
}
}
data(val){
if (val===null){return this._element.innerHTML;}
this._element.innerHTML=val;
return this;
}
remove(){
this._element.remove();
return this;
}
append_to(parent){
parent.appendChild(this._element);
return this;
}
};function CSS(...args){return new CSSElement(...args)};
class DividerElement extends CreateVElementClass({
type:"Divider",
tag:"div",
default_style:{
"margin":"0px",
"padding":"0px",
"width":"100%",
"height":"1px",
"min-height":"1px",
},
}){
constructor(){super();}
};function Divider(...args){return new DividerElement(...args)};;vweb.elements.register(DividerElement);
class DropdownElement extends VStackElement{
constructor({
target=null,
animate=true,
duration=300,
side="left",
auto_remove=false,
min_width=null,
max_width=null,
min_height=null,
max_height=null,
use_target_min=false,
below_target=false,
x_offset=null,
y_offset=null,
content=null,
}={}){
super();
this.target=target;
this.animate=animate;
this.duration=duration;
this.side=side;
this.use_target_min=use_target_min;
this.auto_remove=auto_remove;
this._min_width=min_width;
this._max_width=max_width;
this._min_height=min_height;
this._max_height=max_height;
this.below_target=below_target;
this.x_offset=typeof x_offset!=="number"?0:x_offset;
this.y_offset=typeof y_offset!=="number"?0:y_offset;
if (!this.animate){
this.duration=0;
}
if (this.below_target&&y_offset==null){
this.y_offset=10;
}
this
.hide()
.overflow("hidden")
.background("black")
.border_radius(10)
.padding(5,15)
.border(1,"grey")
.z_index(10)
.position("absolute")
.box_shadow("0px 0px 5px #00000030")
.opacity(0)
.transition(this.animate?`opacity ${this.duration*0.8}ms ease-in, max-height ${this.duration}ms ease-in-out, max-width ${this.duration}ms ease-in-out`:"")
.max_width(0)
.max_height(0)
this.content_items=[];
if (content){
this.mouse_over_background="#FFFFFF10";
this.mouse_out_opacity=0.8;
this._content_padding=[7.5,20];
this._content_margin=[2.5,0];
this.padding(10,0)
this.append(ForEach(content,(item)=>{
const element=(item.href||item.on_click_redirect||item.anchor)?AnchorHStack():HStack();
element.append(
item.image==null?null :ImageMask(item.image)
.frame("1em","1em")
.mask_color("white")
.margin_right("1em")
.flex_shrink(0)
.padding(item.image_padding==null?0:item.image_padding)
.margin_top(item.image_top==null?0:item.image_top),
Text(item.text)
.color("white")
.font_size("inherit")
.wrap(false)
)
.text_decoration("none")
.border("none")
.outline("none")
.padding(...this._content_padding)
.margin(...this._content_margin)
.transition("background 250ms ease-in-out, opacity 250ms ease-in-out")
.on_mouse_over(e=>e.background(this.mouse_over_background).opacity(1))
.on_mouse_out(e=>e.background("transparent").opacity(this.mouse_out_opacity))
.parent(this);
if (item.href){
element.href(item.href)
}else if (Array.isArray(item.on_click)){
element.on_click(...item.on_click);
}else if (item.on_click){
element.on_click(item.on_click);
}else if (Array.isArray(item.on_click_redirect)){
element.on_click(...item.on_click_redirect);
}else if (item.callback){
element.on_click(item.callback);
}
this.content_items.append(element);
return element;
}))
}
}
_get_frame(){
this.visibility("hidden");
this.show();
this.max_width("none")
this.max_height("none")
this.getBoundingClientRect();
if (this.use_target_min){
this._frame_min_width=this.target.clientWidth;
this._frame_min_height=this.target.clientHeight;
}else {
this._frame_min_width=this.min_width();
if (typeof this._frame_min_width!=="number"){
this._frame_min_width=0;
}
if (this._min_width){
this._frame_min_width=Math.max(this._frame_min_width, this._min_width)
}
this._frame_min_height=this.min_height();
if (typeof this._frame_min_height!=="number"){
this._frame_min_height=0;
}
if (this._min_height){
this._frame_min_height=Math.max(this._frame_min_height, this._min_height)
}
}
this._frame_max_width=Math.max(this._frame_min_width, this.clientWidth);
if (this._max_width){this._frame_max_width=Math.min(this._frame_max_width, this._max_width);}
this.max_width(this._frame_max_width)
this._frame_max_height=Math.max(this._frame_min_height, this.clientHeight);
if (this._max_height){this._frame_max_height=Math.min(this._frame_max_height, this._max_height);}
this.hide();
this.visibility("visible");
}
toggle(){
if (this.expanded){return this.minimize();}
return this.expand();
}
expand(){
if (this.next_toggle_allowed!==undefined&&Date.now()<this.next_toggle_allowed){return this;};
if (this.expanded){return this;}
this.expanded=true;
clearTimeout(this.animation_timeout);
this.transition("");
this._get_frame();
this.max_width(this._frame_min_width)
this.max_height(this._frame_min_height)
this.opacity(0)
this.transition(this.animate?`opacity ${this.duration*0.8}ms ease-in, max-height ${this.duration}ms ease-in-out, max-width ${this.duration}ms ease-in-out`:"")
this.show().getBoundingClientRect();
const rect=this.target.getBoundingClientRect();
this
.position(
rect.top+this.y_offset+(this.below_target?rect.height:0),
this.side!=="left"?(window.innerWidth-rect.right-this.x_offset):null,
null,
this.side==="left"?(rect.left+this.x_offset):null
)
.opacity(1)
.max_width(this._frame_max_width)
.max_height(this._frame_max_height)
if (this.close_handler==null){
this.close_handler=(event)=>{
if (this.expanded&&!this.is_nested_child(event.target)&&!this.target.is_nested_child(event.target)){
this.minimize();
}
}
}
document.body.addEventListener("mousedown", this.close_handler);
this.next_toggle_allowed=Date.now()+Math.max(100, this.duration);
if (this.on_expand_callback){
this.on_expand_callback(this);
}
return this;
}
minimize(force=false){
if (!force&&this.next_toggle_allowed!==undefined&&Date.now()<this.next_toggle_allowed){return this;};
if (!force&&!this.expanded){return this;}
this.expanded=false;
this
.max_width(this._frame_min_width)
.max_height(this._frame_min_height)
.opacity(0)
this.animation_timeout=setTimeout(()=>{
if (this.auto_remove){
this.remove();
}else {
this.hide()
}
}, this.duration)
document.body.removeEventListener("mousedown", this.close_handler);
this.next_toggle_allowed=Date.now()+Math.max(100, this.duration);
if (this.on_minimize_callback){
this.on_minimize_callback(this);
}
return this;
}
on_expand(callback){
if (callback==null){return this.on_expand_callback;}
this.on_expand_callback=callback;
return this;
}
on_minimize(callback){
if (callback==null){return this.on_minimize_callback;}
this.on_minimize_callback=callback;
return this;
}
font_size(value){
if (value==null){return super.font_size();}
super.font_size(value);
return this;
}
color(value){
if (value==null){return super.color();}
super.color(value);
this.content_items.iterate(e=>{
e.color(value);
if (e.image){
e.image.mask_color(value);
}
})
return this;
}
iterate_content(callback){
this.content_items.iterate((node)=>callback(node))
return this;
}
content_padding(...args){
if (args.length===0){return this._content_padding;}
this._content_padding=[...args];
this.content_items.iterate((node)=>{node.padding(...args);})
return this;
}
content_margin(...args){
if (args.length===0){return this._content_margin;}
this._content_margin=[...args];
this.content_items.iterate((node)=>{node.margin(...args);})
return this;
}
content_background(value){
if (value==null){return this.mouse_over_background;}
this.mouse_over_background=value;
return this;
}
content_opacity(value){
if (value==null){return this.mouse_out_opacity;}
this.mouse_out_opacity=value;
this.content_items.iterate((node)=>{node.opacity(value);})
return this;
}
};function Dropdown(...args){return new DropdownElement(...args)};;vweb.elements.register(DropdownElement);
class ForEachElement extends CreateVElementClass({
type:"ForEach",
tag:"section",
default_style:{
"border":"none",
"outline":"none",
"background":"transparent",
},
}){
constructor(items,func){
super();
if (Array.isArray(items)){
for (let i=0;i<items.length;i++){
this.append(func(items[i],i,i===items.length-1));
}
}else if (typeof items==="object"){
let index=0;
const keys=Object.keys(items);
keys.iterate((key)=>{
this.append(func(key,items[key],index,index===keys.length-1));
++index;
})
}else {
throw Error(`Parameter "items" has an invalid value type, the valid value types are "array" or "object".`);
}
}
};function ForEach(...args){return new ForEachElement(...args)};;vweb.elements.register(ForEachElement);
class FormElement extends VStackElement{
static default_style={
...VStackElement.default_style,
};
constructor(...children){
super();
this.element_type="Form";
this.styles(FormElement.default_style);
this._button=undefined;
this.fields={};
this._on_submit=(data)=>{};
const _this=this;
this._on_append_callback=function(child){
if (child.element_type==="ExtendedInput"||child.element_type==="ExtendedSelect"||child.element_type==="CheckBox"){
const id=child.id();
if (id!=null&&id!==""){
_this.fields[id]=child;
child.on_input(()=>{
if (child.missing()===true){
child.missing(false);
}
})
child.on_enter(()=>_this.submit())
}
}
else if ((child.element_type==="Button"||child.element_type==="LoaderButton")&&child.on_click()==null){
if (_this._button!==undefined){
_this._button.on_click(()=>{})
}
_this.button(child);
}
if (child.children!=null){
for (let i=0;i<child.children.length;i++){
_this._on_append_callback(child.children[i]);
}
}
};
this.append(...children);
}
data(){
const params={};
let error;
const ids=Object.keys(this.fields);
for (let i=0;i<ids.length;i++){
try {
const id=ids[i];
const element=this.fields[id];
if (element.required()!==true){
params[id]=element.value();
}else {
params[id]=element.submit();
}
}catch(e){
error=e;
}
}
if (error){
throw error;
}
return params;
}
async submit(){
if (this._button===undefined){
throw Error("No submit button has been found, add a button to the form or attach a button using \"Form.button()\".");
}
if (this._button.show_loader!==undefined){
this._button.show_loader();
}
try {
const data=this.data();
if (this._on_submit!==undefined){
const res=this._on_submit(this,data);
if (res instanceof Promise){
await res;
}
}
if (this._button.hide_loader!==undefined){
this._button.hide_loader();
}
}
catch (error){
if (this._on_submit_error!==undefined){
const res=this._on_submit_error(this,error);
if (res instanceof Promise){
await res;
}
if (this._button.hide_loader!==undefined){
this._button.hide_loader();
}
}
else {
if (this._button.hide_loader!==undefined){
this._button.hide_loader();
}
throw error;
}
}
}
button(element_or_id){
if (element_or_id==null){return this._button;}
if (typeof element_or_id==="string"){
element_or_id=document.getElementById(element_or_id);
if (element_or_id==null){
throw Error(`Unable to find element "${element_or_id}".`);
}
}
this._button=element_or_id;
const _this=this;
this._button.on_click(()=>{
_this.submit().catch(console.error)
})
return this;
}
on_submit(callback){
this._on_submit=callback;
return this;
}
on_submit_error(callback){
this._on_submit_error=callback;
return this;
}
};function Form(...args){return new FormElement(...args)};;vweb.elements.register(FormElement);
class FrameModesType{
constructor(...modes){
this.modes=[];
this.active=null;
for (const mode of modes){
if (this.active==null){
this.active=mode;
}
this.modes.push(mode);
this[mode]=[];
}
}
set(mode){
this.active=mode;
for (const m of this.modes){
if (m===mode){
for (const node of this[m]){
node.show();
}
}else {
for (const node of this[m]){
node.hide();
}
}
}
if (this._on_set){
this._on_set(mode);
}
return this;
}
switch(mode){return this.set(mode);}
on_set(callback){
this._on_set=callback;
return this;
}
on_switch(callback){
this._on_set=callback;
return this;
}
};function FrameModes(...args){return new FrameModesType(...args)};
class GoogleMapElement extends CreateVElementClass({
type:"GoogleMap",
tag:"iframe",
default_style:{
"border":"0",
},
default_attributes:{
"width":"100%",
"height":"100%",
"frameborder":"0",
"style":"border:0",
"referrerpolicy":"no-referrer-when-downgrade",
"allowfullscreen":"true",
},
}){
constructor(location,mode="place"){
super();
this.src("https://www.google.com/maps/embed/v1/"+mode+"?key="+google_cloud_api_key+"&"+vweb.utils.url_encode({"q":location.replaceAll(' ','+')}));
}
update(){
this.remove_children();
const children_style={
"width":"calc("+this.style.width+" * (64.0px / 80.0px))",
"height":"calc("+this.style.height+" * (64.0px / 80.0px))",
"margin":"calc("+this.style.width+" * (8.0px / 80.0px))",
"border":"calc("+this.style.width+" * (8.0px / 80.0px)) solid "+this.style.background,
"border-color":this.style.background+" transparent transparent transparent",
}
for (let i=0;i<4;i++){
let e=document.createElement("div");
for (let attr in children_style){
e.style[attr]=children_style[attr];
}
this.append(e);
}
}
};function GoogleMap(...args){return new GoogleMapElement(...args)};;vweb.elements.register(GoogleMapElement);
class GradientType{
constructor(...args){
if (args.length===1){
this.gradient=args[0];
}
else if (args.length>1){
this.type=args[0];
this.colors=[];
for (let i=1;i<args.length;i++){
if (args[i].endsWith("deg")){
this.degree=args[i];
continue;
}
if (typeof args[i+1]==="string"&&args[i+1].includes("%")){
this.colors.push({
color:args[i],
stop:args[i+1],
})
i++;
}else {
this.colors.push({
color:args[i],
stop:null,
})
}
}
}else {
console.error("Invalid number of arguments for class \"Gradient()\".");
}
}
toString(){
if (this.gradient==null){
this.gradient=`${this.type}-gradient(`;
if (this.degree){
this.gradient+=this.degree+", ";
}
for (let i=0;i<this.colors.length;i++){
this.gradient+=this.colors[i].color;
this.gradient+=" ";
let stop=this.colors[i].stop;
if (vweb.utils.is_numeric(stop)&&stop<=1.0){
stop=(stop*100)+"%";
}
this.gradient+=stop;
if (i+1<this.colors.length){
this.gradient+=", ";
}
}
this.gradient+=")";
return this.gradient;
}
return this.gradient;
}
};function Gradient(...args){return new GradientType(...args)};;
class GradientBorderElement extends CreateVElementClass({
type:"GradientBorder",
tag:"div",
default_style:{
"border-width":"1px",
"border-radius":"10px",
},
}){
constructor(text){
super();
this
.content("")
.position("absolute")
.inset(0)
.padding(BorderButtonElement.default_style["--child-border-width"])
.border_radius(BorderButtonElement.default_style["--child-border-radius"])
.background(BorderButtonElement.default_style["--child-background"])
.mask("linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)")
.mask_composite("exclude")
.styles({
"-webkit-mask":"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
"-webkit-mask-composite":(navigator.userAgent.includes("Firefox")||navigator.userAgent.includes("Mozilla"))?"exclude":"xor",
})
}
border_color(val){
if (val===undefined){return this.style.background;}
this.style.background=val;
return this;
}
border_width(value){
if (value==null){
return this.padding();
}
this.padding(value);
return this;
}
};function GradientBorder(...args){return new GradientBorderElement(...args)};;vweb.elements.register(GradientBorderElement);
class ImageElement extends CreateVElementClass({
type:"Image",
tag:"img",
default_style:{
"margin":"0px",
"padding":"0px",
"object-fit":"cover",
},
}){
static default_alt=null;
constructor(src,alt){
super();
if (vweb.is_safari){
this.attachShadow({mode:'open'});
this._e=document.createElement("img");
this._e.style.objectFit="cover";
this._e.style.width="100%";
this._e.style.height="100%";
this.shadowRoot.appendChild(this._e);
this.position("relative");
this.overflow("hidden");
}
this.src(src);
if (alt!=null){
this.alt(alt);
}else if (ImageElement.default_alt!=null){
this.alt(ImageElement.default_alt);
}
if (src){
const aspect_ratio=vweb.static.aspect_ratio(src);
if (aspect_ratio!=null){
this.aspect_ratio(aspect_ratio)
}else if (!vweb.production&&Object.keys(vweb.static.aspect_ratios).length>0&&src.charAt(0)==="/"){
console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`))
}
}
}
set_default(){
super.set_default(ImageElement);
const alt=this.alt();
if (alt!=null){
ImageElement.default_alt=alt;
}
return this;
}
src(value){
if (this._e===undefined){
return super.src(value);
}
if (value==null){
return this._e.src;
}
this._e.src=src;
return this;
}
alt(value){
if (this._e===undefined){
return super.alt(value);
}
if (value==null){
return this._e.alt;
}
this._e.alt=value;
return this;
}
completed(value){
if (this._e===undefined){
return super.completed;
}
return this._e.completed;
}
src(value){
if (this._e===undefined){
return super.src(value);
}
if (value==null){
return this._e.src;
}
this._e.src=value;
return this;
}
height(value,check_attribute=true){
if (this._e===undefined){
return super.height(value,check_attribute);
}
if (value==null){
return this._e.height;
}
if (typeof value==="string"&&value.includes("%")){
super.height(value, false);
}else {
this._e.style.height=this.pad_numeric(value,"px");
this._e.height=this.pad_numeric(value,"");
}
return this;
}
min_height(value){
if (this._e===undefined){
return super.min_height(value);
}
if (value==null){
return this._e.style.minHeight;
}
if (typeof value==="string"&&value.includes("%")){
super.min_height(value);
}else {
this._e.style.minHeight=this.pad_numeric(value,"px");
}
return this;
}
max_height(value){
if (this._e===undefined){
return super.max_height(value);
}
if (value==null){
return this._e.style.maxHeight;
}
if (typeof value==="string"&&value.includes("%")){
super.max_height(value);
}else {
this._e.style.maxHeight=this.pad_numeric(value,"px");
}
return this;
}
width(value,check_attribute=true){
if (this._e===undefined){
return super.width(value,check_attribute);
}
if (value==null){
return this._e.width;
}
if (typeof value==="string"&&value.includes("%")){
super.width(value, false);
}else {
this._e.style.width=this.pad_numeric(value,"px");
this._e.width=value;
}
return this;
}
min_width(value){
if (this._e===undefined){
return super.min_width(value);
}
if (value==null){
return this._e.style.minWidth;
}
if (typeof value==="string"&&value.includes("%")){
super.min_width(value);
}else {
this._e.style.minWidth=this.pad_numeric(value,"px");
}
return this;
}
max_width(value){
if (this._e===undefined){
return super.max_width(value);
}
if (value==null){
return this._e.style.maxWidth;
}
if (typeof value==="string"&&value.includes("%")){
super.max_width(value);
}else {
this._e.style.maxWidth=this.pad_numeric(value,"px");
}
return this;
}
loading(value){
if (this._e===undefined){
if (value==null){
return this.loading;
}
this.loading=value;
return this;
}
if (value==null){
return this._e.loading;
}
this._e.loading=value;
return this;
}
};function Image(...args){return new ImageElement(...args)};;vweb.elements.register(ImageElement);
class AnchorImageElement extends AnchorElement{
static default_style={
...AnchorElement.default_style,
};
constructor(href,src,alt){
super();
this.href(href);
this.image=Image(src,alt)
.parent(this);
this.append(this.image);
}
set_default(){
return super.set_default(AnchorImage);
}
src(value){if (value==null){return this.image.src();}this.image.src(value); return this;}
alt(value){if (value==null){return this.image.alt();}this.image.alt(value); return this;}
completed(value){if (value==null){return this.image.completed();}this.image.completed(value); return this;}
src(value){if (value==null){return this.image.src();}this.image.src(value); return this;}
height(value, ...args){if (value==null){return this.image.height();}this.image.height(value, ...args); return this;}
min_height(value){if (value==null){return this.image.min_height();}this.image.min_height(value); return this;}
max_height(value){if (value==null){return this.image.max_height();}this.image.max_height(value); return this;}
width(value, ...args){if (value==null){return this.image.width();}this.image.width(value, ...args); return this;}
min_width(value){if (value==null){return this.image.min_width();}this.image.min_width(value); return this;}
max_width(value){if (value==null){return this.image.max_width();}this.image.max_width(value); return this;}
loading(value){if (value==null){return this.image.loading();}this.image.loading(value); return this;}
};function AnchorImage(...args){return new AnchorImageElement(...args)};;vweb.elements.register(AnchorImageElement);
class ImageMaskElement extends CreateVElementClass({
type:"ImageMask",
tag:"div",
default_style:{
"margin":"0px",
"padding":"0px",
"object-fit":"cover",
"display":"inline-block",
"font-family":"inherit",
"font-size":"inherit",
"color":"inherit",
"text-decoration":"none",
"text-underline-position":"none",
"outline":"none",
"border":"none",
},
}){
constructor(src){
super();
this.mask_child=VStack()
.parent(this)
.width("100%")
.height("100%")
.background("black")
if (src!=null){
this.mask_child.mask("url('"+src+"') no-repeat center/contain");
}
this.append(this.mask_child);
this.src(src);
if (src){
const aspect_ratio=vweb.static.aspect_ratio(src);
if (aspect_ratio!=null){
this.aspect_ratio(aspect_ratio)
}else if (!vweb.production&&Object.keys(vweb.static.aspect_ratios).length>0&&src.charAt(0)==="/"){
console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`))
}
}
}
mask_color(value){
if (value==null){
return this.mask_child.style.background;
}
this.mask_child.style.background=value;
return this;
}
color(value){
return this.mask_color(value);
}
transition_mask(value){
if (value==null){return this.mask_child.transition();}
this.mask_child.transition(value)
return this;
}
src(value){
if (value==null){
return this._src;
}
this.mask_child.mask("url('"+value+"') no-repeat center/contain");
this._src=value;
return this;
}
mask(value){
if (value==null){
return this.mask_child.mask();
}
this.mask_child.mask(value);
return this;
}
};function ImageMask(...args){return new ImageMaskElement(...args)};;vweb.elements.register(ImageMaskElement);
class AnchorImageMaskElement extends CreateVElementClass({
type:"AnchorImageMask",
tag:"a",
default_style:{
"margin":"0px",
"padding":"0px",
"object-fit":"cover",
"display":"inline-block",
"font-family":"inherit",
"font-size":"inherit",
"color":"inherit",
"text-decoration":"none",
"text-underline-position":"none",
"cursor":"pointer",
"outline":"none",
"border":"none",
},
}){
constructor(src){
super();
this.mask_child=VStack()
.width("100%")
.height("100%")
.background("black")
if (src!=null){
this.mask_child.mask("url('"+src+"') no-repeat center/contain");
}
this.append(this.mask_child);
this.src(src);
if (src){
const aspect_ratio=vweb.static.aspect_ratio(src);
if (aspect_ratio!=null){
this.aspect_ratio(aspect_ratio)
}else if (!vweb.production&&Object.keys(vweb.static.aspect_ratios).length>0&&src.charAt(0)==="/"){
console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`))
}
}
}
mask_color(value){
if (value==null){
return this.mask_child.style.background;
}
this.mask_child.style.background=value;
return this;
}
color(value){
return this.mask_color(value);
}
src(value){
if (value==null){
return this._src;
}
this.mask_child.mask("url('"+value+"') no-repeat center/contain");
this._src=value;
return this;
}
mask(value){
if (value==null){
return this.mask_child.mask();
}
this.mask_child.mask(value);
return this;
}
};function AnchorImageMask(...args){return new AnchorImageMaskElement(...args)};;vweb.elements.register(AnchorImageMaskElement);
class InputElement extends CreateVElementClass({
type:"Input",
tag:"input",
default_style:{
"margin":"0px 0px 0px 0px",
"padding":"2.5px 5px 2.5px 5px",
"font":"inherit",
"color":"inherit",
"background":"none",
"outline":"none",
"border":"none",
"border-radius":"10px",
"text-align":"start",
"white-space":"nowrap",
},
default_attributes:{
"spellcheck":"false",
"autocorrect":"off",
"autocapitalize":"none",
},
}){
constructor(placeholder,type="text",value=null){
super();
if (vweb.is_safari){
this.attachShadow({mode:'open'});
this._e=document.createElement("input");
this._e.style.font="inherit";
this._e.style.color="inherit";
this._e.style.background="none";
this._e.style.border="none";
this._e.style.outline="none";
this._e.style.whitespace="nowrap";
this._e.style.width="100%";
this._e.style.padding=InputElement.default_style.padding;
this.shadowRoot.appendChild(this._e);
this.padding("0")
}
this.placeholder(placeholder);
this.type(type||"text");
this.value(value);
}
value(val){if (this._e===undefined){return super.value(val);}if (val==null){return this._e.value;}this._e.value=val; return this;}
required(val){if (this._e===undefined){return super.required(val);}if (val==null){return this._e.required;}this._e.required=val; return this;}
type(val){if (this._e===undefined){return super.type(val);}if (val==null){return this._e.type;}this._e.type=val; return this;}
placeholder(val){if (this._e===undefined){return super.placeholder(val);}if (val==null){return this._e.placeholder;}this._e.placeholder=val; return this;}
resize(val){if (this._e===undefined){return super.resize(val);}if (val==null){return this._e.resize;}this._e.resize=val; return this;}
padding(...values){
if (this._e===undefined){return super.padding(...values);}
if (values.length===0){
return this._e.style.padding;
}else if (values.length===1){
this._e.style.padding=this.pad_numeric(values[0]);
}else if (values.length===2){
if (values[0]!=null){
this._e.style.paddingTop=this.pad_numeric(values[0]);
}
if (values[1]!=null){
this._e.style.paddingRight=this.pad_numeric(values[1]);
}
if (values[0]!=null){
this._e.style.paddingBottom=this.pad_numeric(values[0]);
}
if (values[1]!=null){
this._e.style.paddingLeft=this.pad_numeric(values[1]);
}
}else if (values.length===4){
this._e.style.paddingTop=this.pad_numeric(values[0]);
if (values[1]!=null){
this._e.style.paddingRight=this.pad_numeric(values[1]);
}
if (values[2]!=null){
this._e.style.paddingBottom=this.pad_numeric(values[2]);
}
if (values[3]!=null){
this._e.style.paddingLeft=this.pad_numeric(values[3]);
}
}else {
console.error("Invalid number of arguments for function \"padding()\".");
}
return this;
}
};function Input(...args){return new InputElement(...args)};;vweb.elements.register(InputElement);
class InputBoxElement extends CreateVElementClass({
type:"InputBox",
tag:"textarea",
default_style:{
"margin":"0px 0px 0px 0px",
"padding":"2.5px 5px 2.5px 5px",
"height":"20px",
"font":"inherit",
"color":"inherit",
"background":"none",
"outline":"none",
"border":"none",
"border-radius":"10px",
"text-align":"start",
"white-space":"wrap",
"resize":"none",
},
default_attributes:{
"spellcheck":"false",
"autocorrect":"off",
"autocapitalize":"none",
},
}){
constructor(placeholder){
super();
if (vweb.is_safari){
this.attachShadow({mode:'open'});
this._e=document.createElement("textarea");
this._e.style.font="inherit";
this._e.style.color="inherit";
this._e.style.background="none";
this._e.style.border="none";
this._e.style.outline="none";
this._e.style.width="100%";
this._e.style.height="100%";
this._e.style.margin="0";
this._e.style.padding=InputBoxElement.default_style.padding;
this.shadowRoot.appendChild(this._e);
this.padding("0")
}
this.placeholder(placeholder);
}
value(val){if (this._e===undefined){return super.value(val);}if (val==null){return this._e.value;}this._e.value=val; return this;}
required(val){if (this._e===undefined){return super.required(val);}if (val==null){return this._e.required;}this._e.required=val; return this;}
type(val){if (this._e===undefined){return super.type(val);}if (val==null){return this._e.type;}this._e.type=val; return this;}
placeholder(val){if (this._e===undefined){return super.placeholder(val);}if (val==null){return this._e.placeholder;}this._e.placeholder=val; return this;}
resize(val){if (this._e===undefined){return super.resize(val);}if (val==null){return this._e.resize;}this._e.resize=val; return this;}
padding(...values){
if (this._e===undefined){return super.padding(values);}
if (values.length===0){
return this._e.style.padding;
}else if (values.length===1){
this._e.style.padding=this.pad_numeric(values[0]);
}else if (values.length===2){
if (values[0]!=null){
this._e.style.paddingTop=this.pad_numeric(values[0]);
}
if (values[1]!=null){
this._e.style.paddingRight=this.pad_numeric(values[1]);
}
if (values[0]!=null){
this._e.style.paddingBottom=this.pad_numeric(values[0]);
}
if (values[1]!=null){
this._e.style.paddingLeft=this.pad_numeric(values[1]);
}
}else if (values.length===4){
this._e.style.paddingTop=this.pad_numeric(values[0]);
if (values[1]!=null){
this._e.style.paddingRight=this.pad_numeric(values[1]);
}
if (values[2]!=null){
this._e.style.paddingBottom=this.pad_numeric(values[2]);
}
if (values[3]!=null){
this._e.style.paddingLeft=this.pad_numeric(values[3]);
}
}else {
console.error("Invalid number of arguments for function \"padding()\".");
}
return this;
}
};function InputBox(...args){return new InputBoxElement(...args)};;vweb.elements.register(InputBoxElement);
class ExtendedInputElement extends VStackElement{
static default_style={
...VStackElement.default_style,
"color":"inherit",
"font-size":"16px",
"--input-padding":"12px 6px",
"--input-border-radius":"5px",
"--input-border-color":"gray",
"--input-background":"transparent",
"--image-mask-color":"#000",
"--image-size":"20px",
"--image-margin-right":"10px",
"--image-margin-left":"5px",
"--image-alt":"VWeb",
"--focus-color":"#8EB8EB",
"--missing-color":"#E8454E",
};
constructor({
label=null,
image=null,
alt="",
placeholder="Input",
id=null,
readonly=false,
required=false,
type="text",
value=null,
}={}){
super();
if (id!=null){
this.id(id);
}
this.element_type="ExtendedInput";
this._focus_color=ExtendedInputElement.default_style["--focus-color"];
this._missing_color=ExtendedInputElement.default_style["--missing-color"];
this._mask_color=ExtendedInputElement.default_style["--image-mask-color"];
this._initial_border_color="black";
this._missing=false;
this.styles(ExtendedInputElement.default_style);
this.label=Text(label)
.parent(this)
.font_size("inherit")
.margin(0,0,5,0)
.color("inherit")
.width("fit-content")
.ellipsis_overflow(true)
if (label==null){
this.label.hide();
}
this.image=ImageMask(image)
.parent(this)
.mask_color(this._mask_color)
.frame(ExtendedInputElement.default_style["--image-size"],ExtendedInputElement.default_style["--image-size"])
.margin(0)
.margin_right(ExtendedInputElement.default_style["--image-margin-right"])
.margin_left(ExtendedInputElement.default_style["--image-margin-left"])
.alt(alt!==""?alt:ExtendedInputElement.default_style["--image-alt"]);
if (image==null){
this.image.hide();
}
if (type==="box"||type==="area"){
this.input=InputBox(placeholder)
}else {
this.input=Input(placeholder,type)
}
this.input
.parent(this)
.color("inherit")
.readonly(readonly)
.font_size("inherit")
.font_weight("normal")
.margin(0)
.width("100%")
.stretch(true)
.padding(0,5)
.line_height("1.6em")
.box_shadow("none")
.border("none")
.outline("none")
.z_index(1)
.border_radius(0)
.on_focus(()=>{
if (this._missing!==true){
this.input_border.border_color(this._focus_color)
this.container.box_shadow(`0 0 0 3px ${this._focus_color}80`)
}
})
.on_blur(()=>{
if (this._missing!==true){
this.input_border.border_color(this._initial_border_color)
this.container.box_shadow(`0 0 0 0px transparent`)
}
})
this.input_border=GradientBorder()
.z_index(0)
.position(0,0,0,0)
.border_radius(ExtendedInputElement.default_style["--input-border-radius"])
.border_width(1)
.border_color(ExtendedInputElement.default_style["--input-border-color"])
.border_color("0px solid transparent")
.box_shadow(`0 0 0 0px transparent`)
.transition("background 200ms ease-in-out")
this.container=HStack(
VStack(
this.image,
)
.height("1.6em")
.center_vertical(),
this.input_border,
this.input,
)
.parent(this)
.position("relative")
.background(ExtendedInputElement.default_style["--input-background"])
.padding(ExtendedInputElement.default_style["--input-padding"])
.transition("box-shadow 0.2s ease-in-out")
.outline("0px solid transparent")
.box_shadow(`0 0 0 0px transparent`)
.width("100%")
this.error=Text("Incomplete field")
.color(this._missing_color)
.font_size("0.8em")
.margin(7.5,0,0,2.5)
.padding(0)
.leading()
.hide()
if (id!=null){
this.id(id);
}
if (required){
this.required(required);
}
this.append(this.label, this.container, this.error);
if (value){
this.value(value)
}
}
styles(style_dict){
if (style_dict==null){
let styles=super.styles();
styles["--input-background"]=this.container.background();
styles["--input-padding"]=this.container.padding();
styles["--input-border-radius"]=this.container.border_radius();
styles["--input-border-color"]=this.container.border_color();
styles["--image-mask-color"]=this._mask_color;
styles["--image-size"]=this.image.width();
styles["--image-margin-right"]=this.image.margin_right();
styles["--image-margin-left"]=this.image.margin_left();
styles["--image-alt"]=this.image.alt()||"VWeb";
styles["--focus-color"]=this._focus_color;
styles["--missing-color"]=this._missing_color;
return styles;
}else {
return super.styles(style_dict);
}
}
set_default(){
return super.set_default(ExtendedInputElement);
}
focus_color(val){
if (val==null){return this._focus_color;}
this._focus_color=val;
return this;
}
missing_color(val){
if (val==null){return this._missing_color;}
this._missing_color=val;
this.error.color(this._missing_color);
return this;
}
missing(to=null,err="Incomplete field"){
if (to==null){return this._missing;}
else if (to===true){
this._missing=true;
this.input_border.border_color(this._missing_color)
this.container.box_shadow(`0 0 0 3px ${this._missing_color}80`)
this.error.show();
if (err){
this.error.text(err);
}
}else {
this._missing=false;
this.input_border.border_color(this._initial_border_color)
this.container.box_shadow(`0 0 0 0px transparent`)
this.error.hide();
}
return this;
}
set_error(err="Incomplete field"){
return this.missing(true,err);
}
submit(){
const value=this.value();
if (value==null||value===""){
this.missing(true);
throw Error("Fill in all the required fields.");
}
this.missing(false);
return value;
}
mask_color(val){
if (val==null){return this._mask_color;}
this._mask_color=val;
this.image.mask_color(this._mask_color);
return this;
}
show_error(err="Incomplete field"){
this.missing(true,err);
return this;
}
hide_error(){
this.missing(false);
return this;
}
text(val){if (val==null){return this.label.text();}this.label.text(val); return this;}
value(val){if (val==null){return this.input.value();}this.input.value(val); return this;}
required(val){if (val==null){return this.input.required();}this.input.required(val); return this;}
on_enter(val){if (val==null){return this.input.on_enter();}this.input.on_enter(val); return this;}
on_input(val){if (val==null){return this.input.on_input();}this.input.on_input(val); return this;}
border_radius(val){if (val==null){return this.container.border_radius();}this.container.border_radius(val); this.input_border.border_radius(val); return this;}
border_color(val){
if (val==null){return this.container.border_color();}
this._initial_border_color=val;
this.container.border_color(val);
this.input_border.border_color(val);
return this;
}
border_width(val){if (val==null){return this.container.border_width();}this.container.border_width(val); this.input_border.border_width(val); return this;}
border_style(val){if (val==null){return this.container.border_style();}this.container.border_style(val); this.input_border.border_style(val); return this;}
background(val){if (val==null){return this.container.background();}this.container.background(val); return this;}
padding(...args){
if (args.length===0||(args.length===1&&args[0]==null)){return this.container.padding();}
this.container.padding(...args);
return this;
}
border(...args){
if (args.length===0||(args.length===1&&args[0]==null)){return this.input_border.border();}
this.input_border.border(...args);
return this;
}
};function ExtendedInput(...args){return new ExtendedInputElement(...args)};;vweb.elements.register(ExtendedInputElement);
class ExtendedSelectElement extends VStackElement{
static default_style={
...VStackElement.default_style,
"color":"inherit",
"font-size":"16px",
"background":"#FFFFFF",
"--input-padding":"12px 6px",
"--input-border-radius":"5px",
"--input-border-color":"gray",
"--image-mask-color":"#000",
"--image-size":"20px",
"--image-margin-right":"10px",
"--image-margin-left":"5px",
"--image-alt":"VWeb",
"--hover-bg":"#00000007",
"--focus-color":"#8EB8EB",
"--missing-color":"#E8454E",
};
constructor({
label=null,
image=null,
alt="",
placeholder="Placeholder",
id=null,
required=false,
items=[{id:"option",text:"Option",image:null}],
}={}){
super();
if (Array.isArray(items)){
if (typeof items[0]==="string"){
this.items=[];
items.iterate((item)=>{
this.items.append({
id:item,
text:item,
})
});
}else {
this.items=items;
this.items.iterate((item)=>{
if (item.text==null){
item.text=item.id;
}
})
}
}else if (typeof items==="object"&&items!=null){
this.items=[];
Object.keys(items).iterate((key)=>{
if (typeof items[key]==="string"){
this.items.append({
id:key,
text:items[key],
});
}else {
this.items.append({
id:key,
...items[key]
});
}
})
}else {
throw Error(`Parameter "items" should be a defined value of type "array" or "object".`);
}
this.element_type="ExtendedSelect";
this._focus_color=ExtendedSelectElement.default_style["--focus-color"];
this._missing_color=ExtendedSelectElement.default_style["--missing-color"];
this._mask_color=ExtendedSelectElement.default_style["--image-mask-color"];
this._border_color=ExtendedSelectElement.default_style["--input-border-color"];
this._hover_bg=ExtendedSelectElement.default_style["--hover-bg"]
this._missing=false;
this.styles(ExtendedSelectElement.default_style);
this.label=Text(label)
.parent(this)
.font_size("inherit")
.margin(0,0,5,0)
.color("inherit")
.width("fit-content")
.ellipsis_overflow(true)
if (label==null){
this.label.hide();
}
this.image=ImageMask(image)
.parent(this)
.mask_color(this._mask_color)
.frame(ExtendedSelectElement.default_style["--image-size"],ExtendedSelectElement.default_style["--image-size"])
.margin(0)
.margin_right(ExtendedSelectElement.default_style["--image-margin-right"])
.margin_left(ExtendedSelectElement.default_style["--image-margin-left"])
.alt(alt!==""?alt:ExtendedSelectElement.default_style["--image-alt"]);
if (image==null){
this.image.hide();
}
this.input=Input(placeholder)
.parent(this)
.color("inherit")
.readonly(true)
.font_size("inherit")
.margin(0)
.width("100%")
.stretch(true)
.outline("none")
.padding(0,5)
.line_height("1.6em")
.box_shadow("none")
.cursor("pointer")
.border_radius(0)
this.container=HStack(
VStack(
this.image,
)
.height("1.6em")
.center_vertical(),
this.input,
)
.parent(this)
.background(ExtendedSelectElement.default_style["background"])
.padding(ExtendedSelectElement.default_style["--input-padding"])
.border_radius(ExtendedSelectElement.default_style["--input-border-radius"])
.border_width(1)
.border_style("solid")
.border_color(this._border_color)
.transition("outline 0.2s ease-in-out, box-shadow 0.2s ease-in-out")
.outline("0px solid transparent")
.box_shadow(`0 0 0 0px transparent`)
.width("100%")
.on_click(()=>{
if (this.dropdown.is_hidden()){
this.expand();
}
})
this.error=Text("Incomplete field")
.color(this._missing_color)
.font_size("0.8em")
.margin(7.5,0,0,2.5)
.padding(0)
.leading()
.hide()
this.dropdown=Scroller()
.parent(this)
.position(0, null, null, null)
.background(ExtendedSelectElement.default_style["background"])
.border_radius(ExtendedSelectElement.default_style["--input-border-radius"])
.border_width(1)
.border_style("solid")
.border_color(this._border_color)
.box_shadow("0px 0px 5px #00000050")
.frame("100%","100%")
.z_index(10)
.hide()
this.append(this.label, this.container, this.error, this.dropdown);
this.position("relative")
this.overflow("visible");
super.background("none")
if (id!=null){
this.id(id);
}
if (required){
this.required(required);
}
this._on_dropdown_close=(event)=>{
let parent=event.target.parentElement;
let stop=true;
for (let i=0;i<4;i++){
if (parent==null){break;}
else if (parent===this.dropdown){
stop=false; break;
}
parent=parent.parentElement;
}
if (stop){
this.dropdown.hide();
window.removeEventListener("mousedown", this._on_dropdown_close)
}
}
}
dropdown_height(val){
if (val===undefined){
return this._dropdown_height;
}
this._dropdown_height=val;
return this;
}
styles(style_dict){
if (style_dict==null){
let styles=super.styles();
styles["--input-padding"]=this.container.padding();
styles["--input-border-radius"]=this.container.border_radius();
styles["--input-border-color"]=this._border_color;
styles["--image-mask-color"]=this._mask_color;
styles["--image-size"]=this.image.width();
styles["--image-margin-right"]=this.image.margin_right();
styles["--image-margin-left"]=this.image.margin_left();
styles["--image-alt"]=this.image.alt()||"VWeb";
styles["--focus-color"]=this._focus_color;
styles["--missing-color"]=this._missing_color;
return styles;
}else {
return super.styles(style_dict);
}
}
set_default(){
return super.set_default(ExtendedSelectElement);
}
focus_color(val){
if (val==null){return this._focus_color;}
this._focus_color=val;
return this;
}
missing_color(val){
if (val==null){return this._missing_color;}
this._missing_color=val;
this.error.color(this._missing_color);
return this;
}
missing(to=null,err="Incomplete field"){
if (to==null){return this._missing;}
else if (to===true){
this._missing=true;
this.container.outline(`1px solid ${this._missing_color}`)
this.container.box_shadow(`0 0 0 3px ${this._missing_color}80`)
this.image.mask_color(this._missing_color)
this.error.show();
if (err){
this.error.text(err);
}
}else {
this._missing=false;
this.container.outline("0px solid transparent")
this.container.box_shadow(`0 0 0 0px transparent`)
this.image.mask_color(this._mask_color)
this.error.hide();
}
return this;
}
set_error(err="Incomplete field"){
return this.missing(true,err);
}
submit(){
const value=this.value();
if (value==null||value===""){
this.missing(true);
throw Error("Fill in all the required fields.");
}
this.missing(false);
return value;
}
expand(){
window.addEventListener("mousedown", this._on_dropdown_close);
this.dropdown.remove_children();
this.dropdown.top(this.label.clientHeight+(this.label.is_hidden()?0:5))
const search=Input("Search")
.color("inherit")
.font_size("inherit")
.margin(10)
.padding(0)
.width("calc(100% - 20px)")
.outline("none")
.box_shadow("none")
.border_radius(0)
.on_input((e,event)=>{
const query=e.value();
if (query.length===0){
content.inner_html("");
this.items.iterate((item)=>{
content.append(item.stack);
})
}else {
const results=vweb.utils.fuzzy_search({
query,
targets:this.items,
limit:null,
case_match:false,
allow_exceeding_chars:true,
key:["id","text"],
});
content.inner_html("");
results.iterate((item)=>{
content.append(item.stack);
})
}
})
const content=VStack()
.frame("100%")
.padding(5,0)
let i=0;
let min_height;
this.dropdown.items=[];
this.items.iterate((item)=>{
let img;
if (item.image!=null){
img=ImageMask(item.image)
.mask_color(this._mask_color)
.frame(ExtendedSelectElement.default_style["--image-size"],ExtendedSelectElement.default_style["--image-size"])
.margin(0)
.margin_right(ExtendedSelectElement.default_style["--image-margin-right"])
.margin_left(ExtendedSelectElement.default_style["--image-margin-left"])
.alt(alt!==""?alt:ExtendedSelectElement.default_style["--image-alt"])
.pointer_events("none")
}
const text=Text(item.text)
.color("inherit")
.font_size("inherit")
.white_space("pre")
.margin(0)
.width("100%")
.stretch(true)
.pointer_events("none")
const stack=HStack(img,text)
.width("100%")
.padding(5,10)
.background("transparent")
.transition("background 0.2 ease-in-out")
.on_click(()=>{
this.dropdown.hide();
this._value=item.id;
this.input.value(item.text);
if (this._on_change_callback!=null){
this._on_change_callback(this,item.id);
}
window.removeEventListener("mousedown", this._on_dropdown_close)
})
.on_mouse_over((e)=>e.background(this._hover_bg))
.on_mouse_out((e)=>e.background("transparent"))
item.stack=stack;
content.append(stack);
++i;
})
if (this.items.length>15){
this.dropdown.append(
search,
Divider()
.margin(0)
.background(this._border_color),
content,
);
}else {
this.dropdown.append(content);
}
this.dropdown.show();
if (this.items.length>15){
search.select();
}
if (this._dropdown_height!==undefined){
this.dropdown.fixed_height(this._dropdown_height);
}
else if (this.items.length>15){
this.dropdown.fixed_height((this.dropdown.content.child(0).clientHeight)*Math.min(this.items.length,10)+10)
}
else {
this.dropdown.fixed_height((this.dropdown.content.child(0).child(0).clientHeight)*Math.min(this.items.length,10)+10)
}
return this;
}
value(val){
if (val==null){return this._value;}
this.items.iterate((item)=>{
if (item.id===val){
this._value=val;
this.input.value(item.text);
if (this._on_change_callback!=null){
this._on_change_callback(this,val);
}
}
})
return this;
}
mask_color(val){
if (val==null){return this._mask_color;}
this._mask_color=val;
this.image.mask_color(this._mask_color);
return this;
}
background(val){
if (val==null){return this.background();}
this.container.background(val)
this.dropdown.background(val)
return this;
}
border_radius(val){
if (val==null){return this.container.border_radius();}
this.container.border_radius(val);
this.dropdown.border_radius(val);
return this;
}
border_color(val){
if (val==null){return this._border_color;}
this._border_color=val;
this.container.border_color(this._border_color);
this.dropdown.border_color(this._border_color);
return this;
}
border_width(val){
if (val==null){return this.container.border_width();}
this.container.border_width(val);
this.dropdown.border_width(val);
return this;
}
border_style(val){
if (val==null){return this.container.border_style();}
this.container.border_style(val);
this.dropdown.border_style(val);
return this;
}
padding(...args){
if (args.length===0||(args.length===1&&args[0]==null)){return this.container.padding();}
this.container.padding(...args);
this.dropdown.padding(...args);
return this;
}
border(...args){
if (args.length===0||(args.length===1&&args[0]==null)){return this.container.border();}
this.container.border(...args);
this.dropdown.border(...args);
return this;
}
on_change(callback){
if (callback==null){return this._on_change_callback;}
this._on_change_callback=callback;
return this;
}
text(val){if (val==null){return this.label.text();}this.label.text(val); return this;}
required(val){if (val==null){return this.input.required();}this.input.required(val); return this;}
};function ExtendedSelect(...args){return new ExtendedSelectElement(...args)};;vweb.elements.register(ExtendedSelectElement);
class ListItemElement extends CreateVElementClass({
type:"ListItem",
tag:"li",
default_style:{},
}){
constructor(...content){
super();
this.append(...content);
}
};function ListItem(...args){return new ListItemElement(...args)};;vweb.elements.register(ListItemElement);
class UnorderedListElement extends CreateVElementClass({
type:"UnorderedList",
tag:"ul",
default_style:{},
}){
constructor(items=[]){
super();
if (Array.isArray(items)){
items.iterate(node=>{this.append_item(node)})
}else {
console.error(`Invalid type "${vweb.scheme.value_type(items)}" for parameter "items" the valid type is "array".`)
}
}
append_item(content){
if (!(content instanceof ListItemElement)){
content=ListItem(content);
}
this.append(content)
return this;
}
};function UnorderedList(...args){return new UnorderedListElement(...args)};;vweb.elements.register(UnorderedListElement);
class OrderedListElement extends CreateVElementClass({
type:"OrderedList",
tag:"ol",
default_style:{},
}){
constructor(items=[]){
super();
if (Array.isArray(items)){
items.iterate(node=>{this.append_item(node)})
}else {
console.error(`Invalid type "${vweb.scheme.value_type(items)}" for parameter "items" the valid type is "array".`)
}
}
append_item(content){
if (!(content instanceof ListItemElement)){
content=ListItem(content);
}
this.append(content)
return this;
}
};function OrderedList(...args){return new OrderedListElement(...args)};;vweb.elements.register(OrderedListElement);
class RingLoaderElement extends CreateVElementClass({
type:"RingLoader",
tag:"div",
default_style:{
"width":"80px",
"height":"80px",
"--child-background":"black",
"--border-width-factor":"1",
"display":"inline-block",
"position":"relative",
},
}){
constructor(){
super();
this.element_type="RingLoader";
this.update();
}
background(value){
if (value==null){return this.style["--child-background"];}
this.style["--child-background"]=value;
return this;
}
border_width_factor(value){
if (value==null){return this.style["--border-width-factor"];}
this.style["--border-width-factor"]=value;
return this;
}
update(){
this.remove_children();
const width=parseFloat(this.style.width.replace("px",""));
const height=parseFloat(this.style.height.replace("px",""));
const background=this.style["--child-background"];
const border_width_factor=parseFloat(this.style["--border-width-factor"])
const children_style={
"box-sizing":"border-box",
"display":"block",
"position":"absolute",
"width":`${width*(64.0/80.0)}px`,
"height":`${height*(64.0/80.0)}px`,
"margin":`${width*(8.0/80.0)}px`,
"border":`${width*(8.0/80.0*border_width_factor)}px solid ${background}`,
"border-color":`${background} transparent transparent transparent`,
"border-radius":"50%",
"animation":"RingLoader 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
};
for (let i=0;i<4;i++){
let e=document.createElement("div");
for (let attr in children_style){
e.style[attr]=children_style[attr];
}
if (i==1){
e.style.animationDelay="-0.45s";
}else if (i==2){
e.style.animationDelay="-0.3s";
}else if (i==3){
e.style.animationDelay="-0.15s";
}
this.append(e);
}
return this;
}
};function RingLoader(...args){return new RingLoaderElement(...args)};;vweb.elements.register(RingLoaderElement);
class PopupElement extends VStackElement{
constructor({
title="",
text="",
no="No",
yes="Yes",
image=false,
image_color="white",
content=[],
auto_hide=true,
auto_remove=false,
animation_duration=0,
blur=0,
on_no=()=>{},
on_yes=()=>{},
on_popup=()=>{},
}){
super();
this.element_type="Popup";
this.mutex=new Mutex();
this.auto_hide=auto_hide;
this.auto_remove=auto_remove;
this.animation_duration=animation_duration;
this.blur=blur;
this.on_no_handler=on_no;
this.on_yes_handler=on_yes;
this.on_popup_handler=on_popup;
this.escape_handler=(event)=>{
if (event.key=="Escape"){
this.close();
}
};
this.image=ImageMask(image)
.mask_color(image_color)
.frame(35,35)
.position(-17.5,"calc(50% - 17.5px)", null, null)
.parent(this)
.abs_parent(this);
if (image===false){
this.image.hide();
}
this.title=Title()
.inner_html(title)
.font_family("inherit")
.font_weight(500)
.font_size(34)
.abs_parent(this)
.parent(this)
this.text=Text()
.inner_html(text)
.font_family("inherit")
.font_size(16)
.line_height(22)
.max_width(300)
.margin(15,20,0,20)
.wrap(true)
.abs_parent(this)
.parent(this)
this.no_button=LoaderButton(no)
.padding(10,10,10,10)
.stretch(true)
.margin_right(5)
.abs_parent(this)
.parent(this)
.on_click(async ()=>{
this.no_button.show_loader();
await this.close();
this.no_button.hide_loader();
})
this.yes_button=LoaderButton(yes)
.padding(10,10,10,10)
.stretch(true)
.margin_left(5)
.abs_parent(this)
.parent(this)
.on_click(async ()=>{
this.yes_button.show_loader();
let removed_escape_handler=false;
if (this.auto_remove||this.auto_hide){
this.opacity(0);
if (this.blur!=null){this.background_blur(0);}
if (this.auto_remove){
setTimeout(()=>this.remove(), this.animation_duration);
}else if (this.auto_hide){
setTimeout(()=>this.hide(), this.animation_duration);
}
document.body.removeEventListener("keydown", this.escape_handler);
removed_escape_handler=true;
}
const res=this.on_yes_handler(this);
if (res instanceof Promise){
try {await res;}
catch (err){console.error(err);}
}
if (!removed_escape_handler&&(this.display()==="none"||this.visibility()==="hidden"||this.parentElement==null)){
document.body.removeEventListener("keydown", this.escape_handler);
}
this.mutex.unlock();
this.yes_button.hide_loader();
});
this.buttons=HStack(this.no_button, this.yes_button)
.width("100%")
.margin_top(30)
.abs_parent(this)
.parent(this)
this.content=VStack(...content)
.abs_parent(this)
.parent(this);
this.widget=VStack(
this.image,
this.title,
this.text,
this.content,
this.buttons,
)
.position("relative")
.text_center()
.padding(40,20,20,20)
.max_width(400)
.border_radius(10)
.background("black")
.border(1,"gray")
.box_shadow("0px 0px 10px #00000050")
.abs_parent(this)
.parent(this)
this.append(this.widget)
this.opacity(1);
this.transition(`opacity ${animation_duration*0.9}ms ease, backdrop-filter ${animation_duration}ms ease`)
this.position(0,0,0,0)
this.background("#00000060")
this.center()
this.center_vertical()
this.z_index(10000)
this.on_click((_,event)=>{
if (event.target===this.widget||this.widget.is_nested_child(event.target)){
return null;
}
this.close(true)
})
if (blur!=null&&blur>0){
this.background_blur(blur);
}
}
set_default(){
return super.set_default(PopupElement);
}
async await(){
await this.mutex.lock();
this.mutex.unlock();
}
async remove_animation(){
return new Promise((resolve)=>{
this.opacity(0);
if (this.blur!=null){this.background_blur(0);}
document.body.removeEventListener("keydown", this.escape_handler);
setTimeout(()=>{this.remove();resolve()}, this.animation_duration);
});
}
async hide_animation(){
return new Promise((resolve)=>{
this.opacity(0);
if (this.blur!=null){this.background_blur(0);}
document.body.removeEventListener("keydown", this.escape_handler);
setTimeout(()=>{this.hide();resolve()}, this.animation_duration);
});
}
async close(){
const promise=new Promise(async (resolve)=>{
if (this.auto_remove){
await this.remove_animation();
}else if (this.auto_hide){
await this.hide_animation();
}
resolve()
})
if (this._on_no_called!==true){
this._on_no_called=true;
const res=this.on_no_handler(this);
if (res instanceof Promise){
try {await res;}
catch (err){console.error(err);}
}
}
this.mutex.unlock();
await promise;
}
image_color(value){
if (value==null){
return this.image.mask_color();
}
this.image.mask_color(value);
return this;
}
async popup({
title=null,
text=null,
image=null,
image_color=null,
content=null,
on_no=null,
on_yes=null,
auto_close=true,
}={}){
this.on_popup_handler(this);
this.opacity(0);
if (this.blur!=null){this.background_blur(0);}
this.show();
this.getBoundingClientRect();
this.opacity(1);
if (this.blur!=null){this.background_blur(this.blur);}
this._on_no_called=false;
this.auto_close=auto_close;
if (title!==null){
this.title.inner_html(title);
}
if (text!==null){
this.text.inner_html(text);
}
if (image!==null){
this.image.src(image);
this.image.show();
}
if (image_color!==null){
this.image.mask_color(image_color);
}
if (on_no!==null){
this.on_no_handler=on_no;
}
if (on_yes!==null){
this.on_yes_handler=on_yes;
}
await this.mutex.lock();
if (content!==null){
this.content.inner_html("");
this.content.append(...content);
}
this.show();
this.focus();
document.body.addEventListener("keydown", this.escape_handler);
}
};function Popup(...args){return new PopupElement(...args)};;vweb.elements.register(PopupElement);
vweb.elements.register(Popup);
class PseudoElement extends CreateVElementClass({
type:"Psuedo",
tag:"div",
default_style:{},
}){
constructor(...children){
super();
this.append(...children);
this.added_to_elements=[];
}
update(){
this.added_to_elements.iterate(item=>{
item.node.pseudo(item.type, this);
})
return this;
}
};function Pseudo(...args){return new PseudoElement(...args)};;vweb.elements.register(PseudoElement);
class RefundViewElement extends VStackElement{
static default_style={
...VStackElement.default_style,
};
constructor({
green="green",
red="red",
bg="white",
sub_bg="gray",
title_fg="black",
text_fg="black",
subtext_fg="#6D6E77",
theme_fg="blue",
theme_gradient=null,
border_radius=10,
check_image="/static/icons/check.sign.png",
error_image="/static/icons/warning.white.png",
no_refundable_payments_image="/static/icons/sad.png",
auto_advance=true,
}={}){
super();
this.element_type="RefundView";
this.styles(ExtendedInputElement.default_style);
if (theme_gradient==null){
theme_gradient=theme_fg;
}
this.all_payments=[];
const _this_=this;
this.width("100%")
function Widget(...children){
return VStack(...children)
.background(bg)
.padding(25)
.border_radius(border_radius)
.stretch(true)
}
function WidgetTitle(text){
return Title(text)
.color(title_fg)
.font_size(20)
.flex_shrink(0)
.margin(0,0,5,0)
.padding(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis")
}
function WidgetText(text){
return Text(text)
.color(text_fg)
.font_size(16)
.line_height(18)
.flex_shrink(0)
.margin(0,0,5,0)
.padding(0)
.wrap(true)
}
function CircledImage(src,background=green){
return ImageMask(src)
.padding(7.5)
.frame(30,30)
.mask_color(bg)
.background(background)
.border_radius("50%")
}
this.menu_buttons=[];
this.payments=Widget(
HStack(
ForEach([
"Refundable",
"Refunded",
],(item,index)=>{
const id=item.toLowerCase().replace(" ","_");
return VStack(
WidgetText(item)
.id(id)
.font_size(12)
.color(index===0?theme_gradient:title_fg)
.padding(0)
.margin(0)
.exec((element)=>{
_this_.menu_buttons.push(element);
})
)
.margin_right(15)
.border_radius(25)
.background(sub_bg)
.padding(5,10)
.on_click(()=>{
_this_.payments.show_view(id)
})
})
)
.margin_bottom(15),
WidgetTitle("Refundable Payments")
.margin(0)
.assign_to_parent_as("title"),
Divider()
.margin(25,0,25,0),
VStack(
WidgetTitle("Processing")
.font_size(18),
WidgetText("Retrieving all refundable payments, please wait.")
.font_size(14)
.margin(0,0,0,0)
.center(),
RingLoader()
.background(theme_fg)
.frame(30,30)
.update()
.margin_top(20),
)
.padding(10,0,10,0)
.center()
.center_vertical()
.frame("100%","100%")
.assign_to_parent_as("processing"),
VStack(
WidgetTitle("Error")
.font_size(18),
WidgetText("Encountered an error while retrieving the refundable payments.")
.font_size(14)
.margin(0,0,0,0)
.center(),
CircledImage(error_image,red)
.margin_top(20),
)
.hide()
.center()
.center_vertical()
.frame("100%","100%")
.assign_to_parent_as("error"),
VStack()
.hide()
.assign_to_parent_as("refundable")
.extend({
render:function (){
this.inner_html("");
let index=0;
let count=0;
let last_divider;
_this_.all_payments.iterate((item)=>{
if (item.refund!=null){
return null;
}
++count;
const currency_symbol=vweb.payments.get_currency_symbol(item.product.currency);
const error_element=WidgetText("Some error has occurred.")
.hide()
.margin_top(10)
.font_size(16)
.color(red)
.opacity(0)
.transition("opacity 0.2s ease-in-out")
.extend({
popup:function(text){
if (text instanceof Error){
text=text.message;
}else if (typeof text==="object"&&text.error){
text=text.error;
}
this.text(text);
this.show();
setTimeout(()=>this.opacity(1),10);
return this;
},
});
this.append(
HStack(
item.product.icon==null?null :
Image(item.product.icon)
.frame(30,30)
.flex_shrink(0)
.margin(0,25,0,0),
VStack(
WidgetTitle(item.product.name)
.font_size(16)
.margin(0,10,0,0),
WidgetText(item.product.description)
.color(subtext_fg)
.font_size(14)
.line_height(16)
.margin(10,10,0,0)
.wrap(true)
.padding(0),
WidgetText(`Quantity: ${item.quantity}`)
.color(subtext_fg)
.font_size(14)
.margin(0)
.margin_top(10)
.padding(0)
.flex_shrink(0)
.wrap(true),
WidgetText(`Purchased at ${vweb.utils.unix_to_date(item.timestamp)}.`)
.color(subtext_fg)
.font_size(14)
.margin(0)
.margin_top(10)
.padding(0)
.flex_shrink(0)
.wrap(true),
error_element,
)
.stretch(true),
VStack(
VStack(
WidgetTitle(`${currency_symbol} ${item.amount.toFixed(2)}`)
.font_size(16)
.margin(0)
.padding(0),
WidgetText(`${currency_symbol} ${item.product.price} per item`)
.color(subtext_fg)
.font_size(12)
.margin(5,0,0,0)
.padding(0)
.flex_shrink(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
)
.leading(),
LoaderButton("Refund")
.max_width(120)
.width("100%")
.margin_top(20)
.padding(7.5,15,7.5,15)
.font_size(14)
.loader
.frame(18,18)
.update()
.parent()
.on_click((element)=>{
console.log(item);
element.show_loader()
vweb.payments.create_refund({payment:item,auto_advance:auto_advance})
.then((response)=>{
_this_.payments.render("refunded")
.then(()=>element.hide_loader())
.catch(()=>element.hide_loader())
}).catch((error)=>{
error_element.popup(error);
element.hide_loader()
})
}),
)
.center()
.min_width(120)
.max_width(120)
.height("100%")
)
.width("100%"),
(last_divider=Divider()
.margin(20,0,20,0)),
)
++index;
});
if (last_divider!=null){
last_divider.remove();
}
if (count===0){
this.inner_html("");
this.append(
VStack(
WidgetTitle("No Refundable Payments")
.font_size(18),
WidgetText("Unfortunately no refundable payments were found.")
.font_size(14)
.margin(0,0,0,0)
.center(),
CircledImage(no_refundable_payments_image,red)
.margin_top(20),
)
.padding(12.5,0,12.5,0)
.center()
.center_vertical()
.frame("100%","100%")
);
}
return this;
},
}),
VStack()
.hide()
.assign_to_parent_as("refunded")
.extend({
render:function (){
this.inner_html("");
let index=0;
let count=0;
let last_divider;
_this_.all_payments.iterate((item)=>{
if (item.refund==null){
return null;
}
++count;
const currency_symbol=vweb.payments.get_currency_symbol(item.product.currency);
let refund_status,refund_failure;
switch (item.refund.status){
case "succeeded":
refund_status=VStack(
HStack(
WidgetTitle("Refunded")
.font_size(15)
.margin(0),
CircledImage(check_image,green)
.frame(17.5,17.5)
.padding(4)
.margin(0,0,0,10),
)
.center_vertical(),
WidgetText(item.refund.description)
.font_style("italic")
.color(subtext_fg)
.font_size(14)
.line_height(14)
.margin_top(10)
.wrap(true),
)
.center_vertical()
break;
case "canceled":
refund_status=VStack(
HStack(
WidgetTitle("Cancelled")
.font_size(15)
.margin(0),
CircledImage(check_image,green)
.frame(17.5,17.5)
.padding(4)
.margin(0,0,0,10),
)
.center_vertical(),
WidgetText(item.refund.description)
.font_style("italic")
.color(subtext_fg)
.font_size(14)
.line_height(14)
.margin_top(10)
.wrap(true),
)
.center_vertical()
break;
case "processing":
refund_status=VStack(
HStack(
WidgetTitle("Processing")
.font_size(15)
.margin(0),
RingLoader()
.background(theme_fg)
.frame(17.5,17.5)
.update()
.margin_left(10),
)
.center_vertical(),
WidgetText(item.refund.description)
.font_style("italic")
.color(subtext_fg)
.font_size(14)
.line_height(14)
.margin_top(10)
.wrap(true),
)
.center_vertical()
break;
case "failed":
refund_status=VStack(
HStack(
WidgetTitle("Failed")
.font_size(15)
.margin(0),
CircledImage(error_image,red)
.frame(17.5,17.5)
.padding(4)
.margin(0,0,0,10),
)
.center_vertical(),
WidgetText(item.refund.description)
.font_style("italic")
.color(subtext_fg)
.font_size(14)
.line_height(14)
.margin_top(10)
.wrap(true),
)
break;
case "requires_action":
refund_status=VStack(
HStack(
WidgetTitle("Requires Action")
.font_size(15)
.margin(0),
CircledImage(error_image,red)
.frame(17.5,17.5)
.padding(4)
.margin(0,0,0,10),
)
.center_vertical(),
WidgetText(item.refund.description)
.font_style("italic")
.color(subtext_fg)
.font_size(14)
.line_height(14)
.margin_top(10)
.wrap(true),
)
break;
default:
console.error("Unknown refund status: "+item.refund.status);
break;
}
this.append(
HStack(
item.product.icon==null?null :
Image(item.product.icon)
.frame(30,30)
.flex_shrink(0)
.margin(0,25,0,0),
VStack(
WidgetTitle(item.product.name)
.font_size(18)
.margin(0,10,0,0),
WidgetText(item.product.description)
.color(subtext_fg)
.font_size(14)
.line_height(16)
.margin(10,10,0,0)
.wrap(true)
.padding(0),
WidgetText(`Purchased at ${vweb.utils.unix_to_date(item.timestamp)}.`)
.color(subtext_fg)
.font_size(14)
.margin(10,0,0,0)
.padding(0)
.flex_shrink(0)
.wrap(true),
refund_status
.margin_top(20),
)
.stretch(true),
VStack(
WidgetTitle(`${currency_symbol} ${item.amount.toFixed(2)}`)
.font_size(16)
.margin(0)
.padding(0),
WidgetText(`${currency_symbol} ${item.product.price} per item`)
.color(subtext_fg)
.font_size(12)
.margin(5,0,0,0)
.padding(0)
.flex_shrink(0)
.wrap(false)
.overflow("hidden")
.text_overflow("ellipsis"),
)
)
.width("100%"),
(last_divider=Divider()
.margin(20,0,20,0)),
)
++index;
});
if (last_divider!=null){
last_divider.remove();
}
if (count===0){
this.inner_html("");
this.append(
VStack(
WidgetTitle("No Refunded Payments")
.font_size(18),
WidgetText("No refunded payments were found.")
.font_size(14)
.margin(0,0,0,0)
.center(),
)
.padding(25,0,25,0)
.center()
.center_vertical()
.frame("100%","100%")
);
}
return this;
},
}),
)
.parent(this)
.width("100%")
.extend({
show_view:function(id){
const views={
"processing":"Refundable Payments",
"error":"Refundable Payments",
"refundable":"Refundable Payments",
"refunded":"Refunded Payments",
}
Object.keys(views).iterate((key)=>{
if (key===id){
this[key].show();
this.title.text(views[key]);
}else {
this[key].hide();
}
});
_this_.menu_buttons.iterate((element)=>{
if (element.id()===id){
element.color(theme_gradient)
}else {
element.color(title_fg)
}
})
},
render:async function(show_view="refundable"){
return new Promise((resolve)=>{
vweb.payments.get_refundable_payments()
.then((payments)=>{
_this_.all_payments=payments;
this.refundable.render();
this.refunded.render();
this.show_view(show_view);
resolve();
})
.catch((error)=>{
console.error(error);
this.show_view("error");
resolve();
})
})
}
})
this.payments.render();
this.append(
this.menu,
this.payments,
)
}
set_default(){
return super.set_default(ExtendedInputElement);
}
};function RefundView(...args){return new RefundViewElement(...args)};;vweb.elements.register(RefundViewElement);
class ScrollerElement extends CreateVElementClass({
type:"Scroller",
tag:"div",
default_style:{
"position":"relative",
"margin":"0px",
"padding":"0px",
"display":"flex",
"overflow":"hidden",
"align-content":"flex-start",
"flex-direction":"column",
"scroll-behavior":"auto",
"overscroll-behavior":"auto",
"height":"fit-content",
"content-visibility":"auto",
},
}){
constructor(...children){
super();
if (this.position()!="absolute"){
this.position("relative");
}
super.overflow("hidden");
this.class("hide_scrollbar")
this.styles({
"content-visibility":"auto",
})
this.content=VStack(...children)
.parent(this)
.class("hide_scrollbar")
.position("relative")
.frame("100%","100%")
.flex("1 1 0")
.overflow("scroll")
.overscroll_behavior(ScrollerElement.default_style["overscroll-behavior"])
.styles({
"content-visibility":"auto",
})
this.thumb=VStack()
.parent(this)
.position(0,0, null,0)
.height(30)
.border_radius(10)
.overflow("visible")
.background_color("#CCCCCC")
.opacity(0)
.transition("opacity 0.3s linear")
.box_shadow("0px 0px 5px #00000005")
this.track=VStack(this.thumb)
.parent(this)
.class("hide_scrollbar")
.position(5,5,5, null)
.width(10)
.background_color("transparent")
.border_radius(10)
.transition("background-color 0.3s linear")
.assign("background_value","#28292E")
.overflow("visible")
super.append(this.content, this.track);
this.on_scroll_callbacks=[];
this.iterate=this.content.iterate.bind(this.content);
this.iterate_nodes=this.content.iterate_nodes.bind(this.content);
this.m_delay=1000;
this.track.__background__=this.track.background;
this.track.__background_color__=this.background_color;
this.track.background=function(value){
if (value!=null){
this.__background_value__=value;
}
return this;
}
this.track.background_color=function(value){
if (value!=null){
this.__background_value__=value;
}
return this;
}
this.track.addEventListener("mouseenter",(event)=>{
if (!this.is_scrollable()){
return null;
}
this.track.style.backgroundColor=this.track.__background_value__;
clearTimeout(this.fadeout_timeout);
this.thumb.style.opacity=1;
})
this.track.addEventListener("mouseleave",(event)=>{
if (!this.is_scrollable()){
return null;
}
if (!this.thumb.dragging){
this.track.style.backgroundColor="transparent";
this.thumb.style.opacity=0;
}
})
this.content.addEventListener("scroll",(event)=>{
const height=this.content.clientHeight;
const relative_height=this.track.clientHeight;
const thumb_height=this.thumb.clientHeight;
const scroll_height=this.content.scrollHeight;
const scroll_top=this.content.scrollTop;
let relative_top;
if (scroll_top>=scroll_height-height){
relative_top=relative_height-thumb_height;
}else {
relative_top=relative_height*(scroll_top/(scroll_height-height))-thumb_height/2;
if (relative_top+thumb_height>=relative_height){
relative_top=relative_height-thumb_height-3;
}
}
if (relative_top<0){
relative_top=0;
}
this.thumb.style.transform=`translateY(${relative_top}px)`;
clearTimeout(this.fadeout_timeout);
this.thumb.style.opacity=1;
clearTimeout(this.fadeout_timeout);
this.fadeout_timeout=setTimeout(()=>{
this.track.style.backgroundColor="transparent";
this.thumb.style.opacity=0;
}, this.m_delay)
})
let start_y,old_user_select;
const mouse_up_handler=(event)=>{
this.thumb.dragging=false;
this.style.userSelect=old_user_select;
document.body.removeEventListener("mouseup",mouse_up_handler);
};
this.thumb.onmousedown=(event)=>{
if (!this.is_scrollable()){
return null;
}
start_y=this.content.getBoundingClientRect().top+parseFloat(window.getComputedStyle(this.track).marginTop);
old_user_select=this.content.style.userSelect;
this.style.userSelect="none";
this.thumb.dragging=true;
this.track.style.backgroundColor=this.track.__background_value__;
clearTimeout(this.fadeout_timeout);
this.thumb.style.opacity=1;
document.body.addEventListener("mouseup",mouse_up_handler);
}
this.addEventListener("mousemove",(event)=>{
if (this.thumb.dragging){
const height=this.content.clientHeight;
const y=Math.max(0,event.clientY-start_y);
let y_percentage=vweb.utils.round(y/height,2);
const computed=window.getComputedStyle(this.content);
const max_scroll_top=(
this.content.scrollHeight-
this.content.clientHeight+
parseFloat(computed.paddingTop)+
parseFloat(computed.paddingBottom)
);
const scroll_top=Math.round(max_scroll_top*y_percentage);
this.content.scrollTop=scroll_top;
}
});
this.track.onclick=(event)=>{
if (!this.is_scrollable()){
return null;
}
const height=this.content.clientHeight;
const start_y=this.content.getBoundingClientRect().top+parseFloat(window.getComputedStyle(this.track).marginTop);
const y=Math.max(0,event.clientY-start_y);
let y_percentage=vweb.utils.round(y/height,2);
const computed=window.getComputedStyle(this.content);
const max_scroll_top=(
this.content.scrollHeight-
this.content.clientHeight+
parseFloat(computed.paddingTop)+
parseFloat(computed.paddingBottom)
);
const scroll_top=Math.round(max_scroll_top*y_percentage);
this.content.scrollTop=scroll_top;
};
this._h_alignment=undefined;
this._current_h_alignment=undefined;
this._v_alignment=undefined;
this._current_v_alignment=undefined;
this._alignment_callback_activated=false;
this._alignment_callback=()=>{
if (this._h_alignment!==undefined){
if (this.content.clientWidth>=this.clientWidth){
if (this._current_h_alignment!=="normal"){
super.align_items("normal");
this._current_h_alignment="normal";
}
}else {
if (this._current_h_alignment!==this._h_alignment){
super.align(this._h_alignment);
this._current_h_alignment=this._h_alignment;
}
}
}
if (this._v_alignment!==undefined){
if (this.content.clientHeight>this.clientHeight){
if (this._current_v_alignment!=="normal"){
super.align_vertical("normal");
this._current_v_alignment="normal";
}
}else {
if (this._current_v_alignment!==this._v_alignment){
super.align_vertical(this._v_alignment);
this._current_v_alignment=this._v_alignment;
}
}
}
};
}
is_scrollable(){
return this.content.scrollHeight>this.content.clientHeight||this.content.scrollWidth>this.content.clientWidth;
}
remove_children(){
this.content.inner_html("");
return this;
}
append(...children){
this.content.append(...children);
return this;
}
child(index){
return this.content.child(index);
}
overflow(value){
if (value==null){
return this.content.overflow();
}
this.content.overflow(value);
return this;
}
overflow_x(value){
if (value==null){
return this.content.overflow_x();
}
this.content.overflow_x(value);
return this;
}
super_overflow_x(value){
if (value==null){
return super.overflow_x();
}
super.overflow_x(value);
return this;
}
overflow_y(value){
if (value==null){
return this.content.overflow_y();
}
this.content.overflow_y(value);
return this;
}
super_overflow_y(value){
if (value==null){
return super.overflow_y();
}
super.overflow_y(value);
return this;
}
show_overflow(){
super.overflow("visible");
this.content.overflow("visible");
return this;
}
hide_overflow(){
super.overflow("hidden");
this.content.overflow("auto");
return this;
}
delay(msec){
if (msec==null){
return this.m_delay;
}
this.m_delay=msec;
return this;
}
scroll_top(value){
if (value==null){
return this.content.scrollTop;
}
this.content.scrollTop=value;
return this;
}
scroll_left(value){
if (value==null){
return this.content.scrollLeft;
}
this.content.scrollLeft=value;
return this;
}
scroll_height(){
return this.content.scrollHeight;
}
scroll_width(){
return this.content.scrollWidth;
}
on_scroll(opts_or_callback={callback:null,delay:null}){
if (opts_or_callback==null){return this.on_scroll_callbacks;}
let callback;
if (vweb.utils.is_func(opts_or_callback)){
const e=this;
callback=(event)=>opts_or_callback(e,event);
this.on_scroll_callbacks.push({callback,user_callback:opts_or_callback});
}else {
if (opts_or_callback.delay==null){
callback=opts_or_callback.callback;
}else {
let timer;
const e=this;
callback=function(t){
clearTimeout(timer);
setTimeout(()=>opts_or_callback.callback(e,t),opts_or_callback.delay);
}
}
this.on_scroll_callbacks.push({callback,user_callback:opts_or_callback.callback});
}
this.content.addEventListener("scroll",callback);
return this;
}
remove_on_scroll(callback){
let dropped=[];
this.on_scroll_callbacks.iterate((item)=>{
if (item.user_callback===callback){
this.content.removeEventListener("scroll",item.callback);
}else {
dropped.push(item);
}
})
this.on_scroll_callbacks=dropped;
return this;
}
set_scroll_top_without_event(top){
return this.set_scroll_position_without_event(top);
}
set_scroll_left_without_event(left){
return this.set_scroll_position_without_event(null,left);
}
set_scroll_position_without_event(top=null,left=null){
this.on_scroll_callbacks.iterate((item)=>{
this.content.removeEventListener("scroll",item.callback);
});
if (top!=null){
this.scroll_top(top);
}
if (left!=null){
this.scroll_left(left);
}
this.on_scroll_callbacks.iterate((item)=>{
this.content.addEventListener("scroll",item.callback);
});
return this;
}
align(value){
if (value===null){return this._h_alignment;}
super.align(value);
this._h_alignment=value;
if (this._alignment_callback_activated!==true){
this._alignment_callback_activated=true;
this.on_resize(this._alignment_callback);
this.on_render(this._alignment_callback);
}
return this;
}
center(){
this.align("center");
return this;
}
leading(){
this.align("start");
return this;
}
trailing(){
this.align("end");
return this;
}
align_vertical(value){
if (value===null){return this._v_alignment;}
super.align_vertical(value);
this._v_alignment=value;
if (this._alignment_callback_activated!==true){
this._alignment_callback_activated=true;
this.on_resize(this._alignment_callback);
this.on_render(this._alignment_callback);
}
return this;
}
center_vertical(){
this.align_vertical("center");
return this;
}
leading_vertical(){
this.align_vertical("start");
return this;
}
trailing_vertical(){
this.align_vertical("end");
return this;
}
};function Scroller(...args){return new ScrollerElement(...args)};;vweb.elements.register(ScrollerElement);
class VirtualScrollerElement extends ScrollerElement{
constructor(...children){
super();
this.element_type="VirtualScroller";
this.v_children=[];
this.top_diff=0;
this.scroll_top_value=0;
this.last_v_children=0;
this.append(...children);
this.visible_container=VStack()
.position("relative")
.overflow_x("visible")
.overflow_y("hidden")
.styles({
"content-visibility":"auto",
})
this.content.append(this.visible_container)
this.height_measurer=Span()
.visibility("hidden")
this.content.append(this.height_measurer)
this.render(true);
this.content.addEventListener("scroll",()=>this.render())
}
set_default(){
return super.set_default(VirtualScrollerElement);
}
overflow(value){
if (value==null){
return this.content.overflow();
}
this.content.overflow(value);
this.visible_container.overflow_x(value.split(" ")[0]);
return this;
}
overflow_x(value){
if (value==null){
return this.content.overflow_x();
}
this.content.overflow_x(value);
this.visible_container.overflow_x(value);
return this;
}
remove_children(){
this.v_children=[];
this.visible_container.min_height(0);
this.visible_container.max_height(0);
this.visible_container.inner_html("");
return this;
}
render(){
const last_scroll_top=this.scroll_top_value;
this.scroll_top_value=this.content.scrollTop;
const last_v_children=this.last_v_children;
this.last_v_children=this.v_children.length;
let scrolling_down=true;
if (this.scroll_top_value>last_scroll_top){
scrolling_down=true;
}else if (this.scroll_top_value<last_scroll_top){
scrolling_down=false;
}
const start_y=this.content.scrollTop;
const end_y=start_y+this.content.offsetHeight+this.top_diff;
let is_first=true;
let is_visible=false;
let total_height=0;
let visible_height=0;
this.v_children.iterate((child)=>{
const height=child.v_height!==undefined?child.v_height:this.get_height(child);
if (height==0){
return null;
}
const child_start_y=total_height;
const child_end_y=total_height+height;
total_height+=height;
if (is_first&&child_end_y>=start_y){
child.transform(`translateY(${child_start_y}px)`);
visible_height+=height;
is_first=false;
is_visible=true;
if (!child.rendered){
if (scrolling_down){
this.visible_container.appendChild(child);
}else {
this.visible_container.insertBefore(child, this.visible_container.firstChild);
}
child.rendered=true;
}
}
else if (is_visible&&child_start_y>=end_y){
child.transform(`translateY(${child_start_y-visible_height}px)`);
visible_height+=height;
is_visible=false;
if (!child.rendered){
if (scrolling_down){
this.visible_container.appendChild(child);
}else {
this.visible_container.insertBefore(child, this.visible_container.firstChild);
}
child.rendered=true;
}
}
else if (is_visible){
child.transform(`translateY(${child_start_y-visible_height}px)`);
visible_height+=height;
if (!child.rendered){
if (scrolling_down){
this.visible_container.appendChild(child);
}else {
this.visible_container.insertBefore(child, this.visible_container.firstChild);
}
child.rendered=true;
}
}
else if (child.rendered){
child.remove();
child.rendered=false;
}
})
this.visible_container.min_height(total_height);
this.visible_container.max_height(total_height);
return this;
}
update_heights(){
this.v_children.iterate((child)=>{
child.v_height=this.get_height(child, false);
})
}
update_height(child){
child.v_height=this.get_height(child, false);
}
get_height(element,fixed=true){
let height;
if (fixed){
height=parseFloat(element.style.height);
if (isNaN(height)){
console.error("Every element in the virtual scroller must have a fixed height, ignoring element: "+element);
element.style.display="none";
return 0;
}
}
else {
element.rendered=false;
this.height_measurer.appendChild(element);
height=element.offsetHeight;
this.height_measurer.removeChild(element);
}
const margin_top=parseFloat(element.style.marginTop);
if (!isNaN(margin_top)){
height+=margin_top;
}
const margin_bottom=parseFloat(element.style.marginBottom);
if (!isNaN(margin_bottom)){
height+=margin_bottom;
}
return height;
}
append(...children){
for (let i=0;i<children.length;i++){
const child=children[i];
if (child!=null){
if (child.element_type!=null){
if (
child.element_type=="ForEach"||
child.element_type=="If"||
child.element_type=="IfDeviceWith"
){
child.append_children_to(this);
}else {
this.v_children.push(child);
}
}
else if (vweb.utils.is_func(child)){
this.append(child());
}
else if (child instanceof Node){
this.v_children.push(child);
}
else if (vweb.utils.is_string(child)){
this.v_children.push(document.createTextNode(child));
}
}
}
return this;
}
};function VirtualScroller(...args){return new VirtualScrollerElement(...args)};;vweb.elements.register(VirtualScrollerElement);
class SnapScrollerElement extends VStackElement{
constructor(...children){
super();
this.element_type="SnapScroller";
this.overflow_y("scroll");
this.scroll_snap_type("y mandatory");
this.append(...children);
}
append(...children){
for (let i=0;i<children.length;i++){
const win=children[i];
if (win==null){continue;}
win.min_height("100%");
win.on_render((e)=>{
if (win.scrollHeight>this.clientHeight){
e.align_vertical("default");
}else {
e.center_vertical();
}
})
win.on_resize((e)=>{
if (win.scrollHeight>this.clientHeight){
e.align_vertical("default");
}else {
e.center_vertical();
}
})
win.style.height="100%";
win.style.minHeight="100%";
win.style.maxHeight="100%";
win.style.overflowY="scroll";
win.style["scroll-snap-align"]="start";
super.append(win);
}
return this
}
scroll_into_child(index,behaviour="smooth"){
this.child(index).scrollIntoView({behavior:behaviour});
return this;
}
};function SnapScroller(...args){return new SnapScrollerElement(...args)};;vweb.elements.register(SnapScrollerElement);
class SliderElement extends VStackElement{
constructor(value=0.0){
super();
this.element_type="Slider";
this._type="SliderElement";
this._value=value;
this._enabled_color="green";
this._disabled_color="none";
this.slider=VStack(
VStack()
.position(0, null,0,0)
.background(this._enabled_color)
.transition("right 0.05s ease-out"),
VStack()
.position(0,0,0,0)
.background(this._disabled_color)
.transition("left 0.05s ease-out"),
)
.background("white")
.position("relative")
.frame("100%",5)
.border_radius(10)
.overflow("hidden")
.box_shadow(`0px 0px 2px #00000030`)
.on_click((element,event)=>this.slider_on_mouse_down_handler(event))
.parent(this)
.abs_parent(this)
this.button=VStack()
.border_radius("50%")
.frame(15,15)
.background("gray")
.position("absolute")
.left(0)
.top(0)
.transition("left 0.05s ease-out")
.box_shadow(`0px 0px 2px #00000060`)
.cursor("pointer")
.on_mouse_down(()=>this.on_mouse_down_handler())
.parent(this)
.abs_parent(this)
this.append(this.slider, this.button)
this.min_height(15)
this.position("relative")
this.flex_shrink(0)
this.center_vertical()
this.height("fit-content")
this.slider_on_mouse_down_handler=(event)=>{
this.rect=this.getBoundingClientRect();
this.button_rect=this.button.getBoundingClientRect();
const min=this.rect.left;
const max=this.rect.left+this.rect.width;
const x=Math.max(min,Math.min(event.clientX,max));
this.value((x-min)/(max-min));
}
this.on_mouse_down_handler=()=>{
this.dragging=true;
this.rect=this.getBoundingClientRect();
this.button_rect=this.button.getBoundingClientRect();
document.body.addEventListener("mouseup", this.on_mouse_up_handler);
document.body.addEventListener("mousemove", this.on_mouse_move_handler);
}
this.on_mouse_move_handler=(event)=>{
this.rect=this.getBoundingClientRect();
this.button_rect=this.button.getBoundingClientRect();
const min=this.rect.left;
const max=this.rect.left+this.rect.width;
const x=Math.max(min,Math.min(event.clientX,max));
this.value((x-min)/(max-min));
}
this.on_mouse_up_handler=()=>{
this.dragging=false;
document.body.removeEventListener("mouseup", this.on_mouse_up_handler);
document.body.removeEventListener("mousemove", this.on_mouse_move_handler);
}
this.on_change_handler=()=>{};
if (value!=0.0){
this.on_render(()=>{
this.value(value);
})
}
}
set_default(){
return super.set_default(SliderElement);
}
enabled_color(value){
if (value==null){
return this._enabled_color;
}
this._enabled_color=value;
this.slider.child(0).background(this._enabled_color);
return this;
}
disabled_color(value){
if (value==null){
return this._disabled_color;
}
this._disabled_color=value;
this.slider.child(1).background(this.disabled_color);
return this;
}
on_change(handler){
if (handler==null){
return this.on_change_handler;
}
this.on_change_handler=handler;
return this;
}
value(value){
if (value==null){
return this._value;
}
this._value=Math.max(0.0,Math.min(1.0,value));
this.rect=this.getBoundingClientRect();
this.button_rect=this.button.getBoundingClientRect();
this.slider_rect=this.slider.getBoundingClientRect();
const left=Math.min(
this.rect.width-this.button_rect.width,
Math.max(
0,
(this._value*this.rect.width)-(this.button_rect.width/2)
)
);
this.button.style.left=`${left}px`
this.slider.child(0).right(this.slider_rect.width-left);
this.slider.child(1).left(left);
this.on_change_handler(this, this._value)
return this;
}
};function Slider(...args){return new SliderElement(...args)};;vweb.elements.register(SliderElement);
class SpacerElement extends CreateVElementClass({
type:"Spacer",
tag:"div",
default_style:{
"margin":"0px",
"padding":"0px",
"flex":"1",
"flex-grow":"1",
"background":"#00000000",
"filter":"opacity(0)",
"justify-content":"stretch",
},
}){
constructor(){super();}
};function Spacer(...args){return new SpacerElement(...args)};;vweb.elements.register(SpacerElement);
class SpanElement extends CreateVElementClass({
type:"Span",
tag:"span",
default_style:{},
}){
constructor(inner_html){
super();
this.inner_html(inner_html);
}
};function Span(...args){return new SpanElement(...args)};;vweb.elements.register(SpanElement);
class StepsElement extends VStackElement{
static default_style={
...VStackElement.default_style,
"--steps-tint":"gray",
"--steps-tint-opac":1,
"--steps-step-bg":"gray",
"--steps-step-border":"gray",
"--steps-step-border-radius":"50%",
"--steps-div-bg":"gray",
};
constructor({
content=[],
spacing="1.25em",
}){
super();
this.element_type="Steps";
this.styles(StepsElement.default_style);
if (Array.isArray(arguments[0])){
content=arguments[0];
}
for (let i=0;i<content.length;i++){
if (Array.isArray(content[i])){
content[i]={content:content[i]};
}
}
this._tint=StepsElement.default_style["--steps-tint"];
this._tint_opac=StepsElement.default_style["--steps-tint-opac"];
this._step_bg=StepsElement.default_style["--steps-step-bg"];
this._step_border=StepsElement.default_style["--steps-step-border"];
this._step_border_radius=StepsElement.default_style["--steps-step-border-radius"];
this._div_bg=StepsElement.default_style["--steps-div-bg"];
this._step_nr_nodes=[];
this._step_nodes=[];
this._div_nodes=[];
this._content_nodes=[];
this.append(ForEach(content,(item,index,is_last)=>{
const divider=is_last?null :Divider()
.margin(0)
.font_size("0.7em")
.position("2em", null,0,"0.875em")
.frame(1.5,`calc(100% + ${spacing} - 0.6em)`)
.background(this._div_bg)
.z_index(0)
.exec(e=>this._div_nodes.append(e))
const content=(item.hstack?HStack():VStack())
.z_index(1)
.stretch(true)
.overflow("hidden");
if (typeof item.title==="string"){
content.append(
Span(item.title)
.color("inherit")
.display("block")
.margin_bottom("0.5em")
.font_weight(500)
.line_height("1.6em"),
)
}
if (item.content){
content.append(item.content);
}else if (item.children){
content.append(item.children);
}
if (typeof item.side_by_side_width=="number"){
content.on_resize_rule(
()=>content.clientWidth>=item.side_by_side_width,
()=>content.flex_direction("row"),
()=>content.flex_direction("column"),
)
}
this._content_nodes.append(content);
let step_nr;
const element=HStack(
step_nr=VStack(
VStack()
.assign_to_parent_as("bg")
.background(this._step_bg)
.transition("background 300ms ease-in-out")
.position(0,0,0,0)
.z_index(0),
Span((index+1).toString())
.z_index(1),
)
.position("relative")
.overflow("hidden")
.font_size("0.7em")
.flex_shrink(0)
.frame("1.8em","1.8em")
.margin("0.2em","1em", null, null)
.border_radius(5)
.border(1, this._step_border)
.center()
.center_vertical()
.z_index(1)
.exec(e=>this._step_nr_nodes.append(e)),
divider,
content,
)
.fixed_width("100%")
.margin_top(index>0?spacing:0)
.position("relative")
.exec(e=>this._step_nodes.append(e))
.on_mouse_over(()=>step_nr.bg.opacity(this._tint_opac).background(this._tint))
.on_mouse_out(()=>step_nr.bg.opacity(1).background(this._step_bg))
return element;
}))
}
set_default(){
return super.set_default(TabsElement);
}
styles(style_dict){
if (style_dict==null){
let styles=super.styles();
styles["--steps-tint"]=this._tint;
styles["--steps-step-bg"]=this._step_bg;
styles["--steps-step-border"]=this._step_border;
styles["--steps-step-border-radius"]=this._step_border_radius;
styles["--steps-div-bg"]=this._div_bg;
return styles;
}else {
return super.styles(style_dict);
}
}
tint(value){
if (value==null){return this._tint;}
this._tint=value;
return this;
}
tint_opacity(value){
if (value==null){return this._tint_opac;}
this._tint_opac=value;
return this;
}
content_overflow(value){
if (value==null){return this._content_nodes[0].overflow();}
this._content_nodes.iterate(node=>{
node.overflow(value);
})
return this;
}
divider_background(value){
if (value==null){return this._div_bg;}
this._div_bg=value;
this._div_nodes.iterate(node=>{
node.background(value);
})
return this;
}
step_number_background(value){
if (value==null){return this._step_bg;}
this._step_bg=value;
this._step_nr_nodes.iterate(node=>{
node.bg.background(value);
})
return this;
}
step_number_border_color(value){
if (value==null){return this._step_border;}
this._step_border=value;
this._step_nr_nodes.iterate(node=>{
node.border_color(value);
})
return this;
}
step_number_border_radius(value){
if (value==null){return this._step_border_radius;}
this._step_border_radius=value;
this._step_nr_nodes.iterate(node=>{
node.border_radius(value);
})
return this;
}
iterate_step_numbers(callback){
this._step_nr_nodes.iterate(node=>callback(callback))
return this;
}
iterate_steps(callback){
this._step_nodes.iterate(node=>callback(callback))
return this;
}
};vweb.elements.register(StepsElement);;function Steps(...args){return new StepsElement(...args)};
class SwitchElement extends VStackElement{
constructor(enabled=false){
super();
this.element_type="Switch";
this.slider=VStack()
.background("white")
.frame(35,12.5)
.border_radius(10)
.overflow("visible")
.box_shadow(`0px 0px 2px #00000030`)
.parent(this)
this.button=VStack()
.border_radius("50%")
.frame(17.5,17.5)
.background("gray")
.position("absolute")
.left(0)
.transition("left 0.15s ease-out")
.box_shadow(`0px 0px 2px #00000060`)
.on_click(()=>this.toggle())
.parent(this)
this.append(this.slider, this.button);
this.position("relative")
this.width(35)
this.flex_shrink(0)
this.center_vertical()
this.on_change_handler=()=>{};
this._enabled=enabled;
this._enabled_color="green";
this._disabled_color="gray";
this.enabled=this.value;
this.value(enabled, false);
this.on_theme_update(()=>{
this.value(this._enabled, false);
})
}
set_default(){
return super.set_default(SwitchElement);
}
width(value){
if (value==null){
return super.width();
}
super.width(value);
this.slider.width(value);
return this;
}
min_width(value){
if (value==null){
return super.min_width();
}
super.min_width(value);
this.slider.min_width(value);
return this;
}
max_width(value){
if (value==null){
return super.max_width();
}
super.max_width(value);
this.slider.max_width(value);
return this;
}
height(value){
if (value==null){
return super.height();
}
super.height(value);
this.slider.height(value/2);
return this;
}
min_height(value){
if (value==null){
return super.min_height();
}
super.min_height(value);
this.slider.min_height(value/2);
return this;
}
max_height(value){
if (value==null){
return super.max_height();
}
super.max_height(value);
this.slider.max_height(value/2);
return this;
}
frame(width,height){
if (width!=null){
this.width(width);
}
if (height!=null){
this.height(height);
}
return this;
}
min_frame(width,height){
if (width!=null){
this.min_width(width);
}
if (height!=null){
this.min_height(height);
}
return this;
}
max_frame(width,height){
if (width!=null){
this.max_width(width);
}
if (height!=null){
this.max_height(height);
}
return this;
}
enabled_color(value){
if (value==null){
return this._enabled_color;
}
this._enabled_color=value;
return this;
}
disabled_color(value){
if (value==null){
return this._disabled_color;
}
this._disabled_color=value;
return this;
}
toggle(){
return this.value(!this._enabled);
}
value(value,animate=true){
if (value==null){
return this._enabled;
}
else if (value===true){
this._enabled=value;
if (animate){
clearTimeout(this.timeout);
this.timeout=setTimeout(()=>this.button.background(this._enabled_color),140);
}else {
this.button.background(this._enabled_color);
}
const slider_width=this.slider.getBoundingClientRect().width;
const button_width=this.button.getBoundingClientRect().width;
if (slider_width&&button_width){
this.button.style.left=`${slider_width-button_width}px`;
this.button.style.right="auto";
}else {
this.button.style.left="auto";
this.button.style.right="0px";
}
this.on_change_handler(this, this._enabled);
}
else if (value===false){
this._enabled=value;
if (animate){
clearTimeout(this.timeout);
this.timeout=setTimeout(()=>this.button.background(this._disabled_color),140);
}else {
this.button.background(this._disabled_color);
}
const slider_width=this.slider.getBoundingClientRect().width;
const button_width=this.button.getBoundingClientRect().width;
if (slider_width&&button_width){
if (this.button.style.left==="auto"){
this.button.style.left=`${slider_width-button_width}px`;
setTimeout(()=>{
this.button.style.right="auto";
this.button.style.left="0px";
},10)
}else {
this.button.style.right="auto";
this.button.style.left="0px";
}
}else {
this.button.style.left="0px";
this.button.style.right="auto";
}
this.on_change_handler(this, this._enabled);
}
return this;
}
on_change(handler){
if (handler==null){
return this.on_change_handler;
}
this.on_change_handler=handler;
return this;
}
};function Switch(...args){return new SwitchElement(...args)};;vweb.elements.register(SwitchElement);
class TableHeadElement extends CreateVElementClass({
type:"TableHead",
tag:"thead",
default_style:{
"padding":"0px",
},
}){
constructor(...content){
super();
this.append(...content);
}
};function TableHead(...args){return new TableHeadElement(...args)};;vweb.elements.register(TableHeadElement);
class TableHeaderElement extends CreateVElementClass({
type:"TableHeader",
tag:"th",
default_style:{
"text-align":"left",
"padding":"0px 10px",
},
}){
constructor(...content){
super();
this.append(...content);
}
};function TableHeader(...args){return new TableHeaderElement(...args)};;vweb.elements.register(TableHeaderElement);
class TableBodyElement extends CreateVElementClass({
type:"TableBody",
tag:"tbody",
default_style:{
"padding":"0px",
},
}){
constructor(...content){
super();
this.append(...content);
}
};function TableBody(...args){return new TableBodyElement(...args)};;vweb.elements.register(TableBodyElement);
class TableRowElement extends CreateVElementClass({
type:"TableRow",
tag:"tr",
default_style:{
},
}){
constructor(...content){
super();
this.append(...content);
}
};function TableRow(...args){return new TableRowElement(...args)};;vweb.elements.register(TableRowElement);
class TableDataElement extends CreateVElementClass({
type:"TableData",
tag:"td",
default_style:{
"text-align":"left",
"padding":"0px 10px",
},
}){
constructor(...content){
super();
this.append(...content);
}
};function TableData(...args){return new TableDataElement(...args)};;vweb.elements.register(TableDataElement);
class InnerTableElement extends CreateVElementClass({
type:"InnerTable",
tag:"table",
default_style:{
"border-collapse":"collapse",
"padding":"0",
"margin":0,
"border-spacing":0,
},
}){
constructor(...content){
super();
this.append(...content);
}
};function InnerTable(...args){return new InnerTableElement(...args)};;vweb.elements.register(InnerTableElement);
class TableElement extends CreateVElementClass({
type:"Table",
tag:"div",
default_style:{
"color":"black",
},
}){
constructor({
rows=[
[0,1],
[2,3],
],
columns=["Column 1","Column 2"],
show_columns=true,
}){
super();
this.table_rows=[];
this.table_headers=[];
this.table_datas=[];
this.show_columns=show_columns===true&&columns!==false;
this.create({rows,columns:columns===false?[]:columns});
this.overflow("hidden")
}
iterate(callback){
let row_index=0;
this.table_rows.iterate(row=>{
let column_index=0;
row.iterate(column=>{
callback({
column,
column_index,
columns:row.children.length,
is_last_column:column_index===row.children.length-1,
is_header:this.show_columns&&row_index===0,
row,
rows:this.table_rows.length,
is_last_row:row_index===this.table_rows.length-1,
})
++column_index;
})
++row_index;
})
return this;
}
iterate_rows(callback){
let index=0;
this.table_rows.iterate(e=>{
callback(e,index,index===this.table_rows.length-1)
++index;
});
return this;
}
create({rows,columns}){
if (!Array.isArray(rows)){
console.error(`Invalid type "${vweb.scheme.value_type(rows)}" for parameter "rows" the valid type is "array".`)
return this;
}
if (!Array.isArray(columns)){
console.error(`Invalid type "${vweb.scheme.value_type(columns)}" for parameter "columns" the valid type is "array".`)
return this;
}
return this.append(
this.table=InnerTable(
this.show_columns
?this.table_head=TableHead(
TableRow(
columns.iterate_append(column=>TableHeader(column))
)
.exec(e=>this.table_rows.append(e))
)
.parent(this)
:null,
this.table_body=TableBody(
rows.iterate_append(row=>
TableRow(
row.iterate_append(column=>TableData(column))
)
.exec(e=>this.table_rows.append(e))
)
)
.parent(this),
)
.width("100%")
)
}
borders(...values){
this.border(...values);
this.iterate(({row,column,is_last_column,is_last_row})=>{
if (!is_last_column){
column.border_right(...values)
}
if (!is_last_row){
column.border_bottom(...values)
}
})
return this;
}
head_background(...args){
if (this.table_head){
this.table_head.background(...args)
}
return this;
}
column_padding(...args){
return this.iterate(({column})=>{
column.padding(...args);
})
}
cell_padding(...args){
return this.iterate(({column})=>{
column.padding(...args);
})
}
column_widths(...widths){
this.table.style.tableLayout="fixed";
let i=0;
this.iterate(({column})=>{
column.width(widths[i]);
++i;
})
return this;
}
};function Table(...args){return new TableElement(...args)};;vweb.elements.register(TableElement);
class TabsElement extends VStackElement{
static default_style={
...VStackElement.default_style,
"font-size":"16px",
"font-weight":"500",
"overflow-x":"hidden",
"width":"100%",
"--tabs-tint":"blue",
"--tabs-tab-opac":0.8,
"--tabs-div-bg":"gray",
"--tabs-div-opac":0.5,
};
constructor({
content=[
],
animate=true,
duration=300,
}={}){
super();
this.element_type="Tabs";
this.styles(TabsElement.default_style);
this._animate=animate;
this._duration=duration;
this._tint=TabsElement.default_style["--tabs-tint"];
this._tab_opac=TabsElement.default_style["--tabs-tab-opac"];
this._div_bg=TabsElement.default_style["--tabs-div-bg"];
this._div_opac=TabsElement.default_style["--tabs-div-opac"];
this._selected_node=undefined;
this._tab_nodes=[];
this.color("white")
this.build(content);
}
set_default(){
return super.set_default(TabsElement);
}
styles(style_dict){
if (style_dict==null){
let styles=super.styles();
styles["--tabs-tint"]=this._tint;
styles["--tabs-tab-opac"]=this._tab_opac;
styles["--tabs-div-bg"]=this._div_bg;
styles["--tabs-div-opac"]=this._div_opac;
return styles;
}else {
return super.styles(style_dict);
}
}
build(content=[]){
if (content!=null&&typeof content==="object"&&!Array.isArray(content)){
const old=content;
content=Object.keys(old).iterate_append(item=>({
title:item,
content:old[item],
}));
}
else if (!Array.isArray(content)){
console.error(`Invalid parameter type "${vweb.scheme.value_type(content)}" for parameter "content", the valid type is "array" or "object".`)
return this;
}
this.remove_children();
const main_this=this;
let zstack;
this.append(
HStack(
ForEach(content,(content_item,index,is_last)=>{
const name=content_item.title;
const content_stack=content_item.content;
if (typeof name!=="string"){
console.error(`Invalid parameter type "${vweb.scheme.value_type(name)}" for parameter "content.${index}.title", the valid type is "string".`)
}else if (content_stack==null){
console.error(`Invalid parameter type "${vweb.scheme.value_type(content_stack)}" for parameter "content.${index}.content", the valid type is "Node". or "Array"`)
}
const item=HStack(
Text(name)
.assign_to_parent_as("_header_title")
.flex_shrink(0)
.width("fit-content")
.margin_bottom(5)
.font_weight("inherit")
.font_size("inherit")
.color(index===0?this._tint:"inherit")
.transition("color 250ms ease-in-out, background 250ms ease-in-out"),
VStack()
.assign_to_parent_as("_header_div")
.position(null,0,-1,0)
.height(2)
.border_radius(2)
.background(index===0?this._tint:"transparent")
.transition("background 250ms ease-in-out, opacity 250ms ease-in-out")
)
.center_vertical()
.transition("opacity 250ms ease-in-out")
.display("inline-flex")
.padding(0,2)
.flex_shrink(0)
.margin_right(is_last?0:25)
.position("relative")
.wrap(false)
.opacity(this._tab_opac===false?1:this._tab_opac)
.extend({
on_select(callback){
if (callback==null){return this._on_select;}
this._on_select=callback;
return this;
},
select(){
this._header_title.color(main_this._tint);
this._header_div.background(main_this._tint).opacity(1);
if (main_this._tab_opac!==false){
this.opacity(1)
}
if (main_this._selected_node&&main_this._selected_node!=this){
main_this._selected_node.unselect();
}
if (main_this._animate){
content_stack.show().getBoundingClientRect();
content_stack.opacity(1);
}else {
content_stack.show();
}
if (typeof this._on_select==="function"){
this._on_select(this);
}
main_this._selected_node=this;
return this;
},
on_unselect(callback){
if (callback==null){return this._on_unselect;}
this._on_unselect=callback;
return this;
},
unselect(){
this._header_title.color("inherit");
this._header_div.background("transparent");
if (main_this._tab_opac!==false){
this.opacity(main_this._tab_opac)
}
if (main_this._animate){
content_stack.opacity(0).timeout(main_this._duration,e=>e.hide());
}else {
content_stack.hide();
}
if (typeof this._on_unselect==="function"){
this._on_unselect(this);
}
return this;
},
is_selected(){
return this===main_this._selected_node;
}
})
.on_mouse_over(e=>{
if (e!==main_this._selected_node){
if (this._tab_opac!==false){
e.opacity(1)
}
const color=window.getComputedStyle(e).color;
e._header_div.opacity(this._div_opac).background(color);
}
})
.on_mouse_out(e=>{
if (e!==main_this._selected_node){
if (this._tab_opac!==false){
e.opacity(this._tab_opac)
}
e._header_div.background("transparent").opacity(1);
}
})
.on_click(e=>e.select())
.exec(e=>{
if (index===0){main_this._selected_node=e;}
this._tab_nodes.append(e);
})
if (typeof content_item.on_header==="function"){
content_item.on_header(item, this)
}
if (typeof this._on_tab_header==="function"){
this._on_tab_header(name,item, this)
}
return item;
}),
)
.width("100%"),
this._div=Divider()
.frame("100%",1)
.background(this._div_bg)
.margin(1,0,25,0),
zstack=ZStack(),
)
let index=0;
content.iterate(item=>{
const content_stack=item.content;
if (index===0){
content_stack.show();
}else {
content_stack.hide();
if (this._animate){
content_stack.opacity(0);
}
}
if (content_stack.overflow_x()==="visible"){
content_stack.overflow_x("hidden");
}
content_stack.width("100%");
content_stack.transition(`opacity ${this._duration}ms ease-in-out`)
zstack.append(content_stack);
++index;
});
}
selected(tab){
return this._selected_node?this._selected_node.textContent:null;
}
select(tab){
if (tab==null){return this._selected_node?this._selected_node.textContent:null;}
this._tab_nodes.iterate(node=>{
if (node.textContent===tab){
node.select();
return true;
}
})
return this;
}
tint(value){
if (value==null){return this._tint;}
this._tint=value;
if (this._selected_node){
this._selected_node.select();
}
return this;
}
tab_opacity(value){
if (value==null){return this._tab_opac;}
this._tab_opac=value;
this._tab_nodes.iterate(node=>{
if (this._selected_node!==node){
node.opacity(value);
}
})
return this;
}
divider_background(value){
if (value==null){return this._div_bg;}
this._div_bg=value;
this._div.background(this._div_bg);
return this;
}
divider_opacity(value){
if (value==null){return this._div_opac;}
this._div_opac=value;
return this;
}
on_tab_header(callback){
if (callback==null){return this._on_tab_header;}
this._on_tab_header=callback;
return this;
}
};vweb.elements.register(TabsElement);;function Tabs(...args){return new TabsElement(...args)};
class TextElement extends CreateVElementClass({
type:"Text",
tag:"p",
default_style:{
"margin":"0px 0px 0px 0px",
"padding":"0",
"font-size":"20px",
"color":"inherit",
"text-align":"inherit",
"white-space":"wrap",
},
}){
constructor(text){
super();
this.text(text);
}
};function Text(...args){return new TextElement(...args)};;vweb.elements.register(TextElement);
class ThemesClass{
constructor(
id,
themes={},
){
this.active_id=null;
this.active=null;
this._themes=[];
this._theme_ids=[];
this._attrs=[];
this._css_vars={};
this._id=id;
Object.keys(themes).iterate((theme)=>{
const theme_style=themes[theme];
this._themes.append(theme);
this._theme_ids.append(theme);
this[theme]=theme_style;
if (this.active_id===null){
this.active_id=theme;
this.active=theme_style;
Object.keys(this.active).iterate((id)=>{
document.documentElement.style.setProperty(`--${this._id}_${id}`, this.active[id]);
});
}
Object.keys(theme_style).iterate((id)=>{
this._add_attr(id,theme);
})
})
}
_add_attr(id,theme){
if (theme==null){
this._css_vars[id]=`var(--${this._id}_${id})`;
}else {
const theme_style=this[theme];
if (
typeof theme_style[id]==="string"&&
(
theme_style[id].indexOf("linear-gradient")!==-1||
theme_style[id].indexOf("radial-gradient")!==-1
)
){
theme_style[id]=new String(theme_style[id]);
theme_style[id]._is_gradient=true;
this._css_vars[id]=new String(`var(--${this._id}_${id})`);
this._css_vars[id]._is_gradient=true;
}else {
this._css_vars[id]=`var(--${this._id}_${id})`;
}
}
Object.defineProperty(this,id,{
get:function(){
return this._css_vars[id];
},
enumerable:true,
configurable:true,
});
this._attrs.append(id);
}
set(theme,key,value){
const theme_style=this[theme];
if (typeof value==="string"&&(value.indexOf("linear-gradient")!==-1||value.indexOf("radial-gradient")!==-1)){
theme_style[key]=new String(value);
theme_style[key]._is_gradient=true;
this._css_vars[key]=new String(`var(--${this._id}_${key})`);
this._css_vars[key]._is_gradient=true;
}else {
theme_style[key]=value;
this._css_vars[key]=`var(--${this._id}_${key})`;
}
if (this.active_id===theme){
document.documentElement.style.setProperty(`--${this._id}_${key}`, this.active[key]);
}
return this;
}
get id(){
return `${this._id}.${this.active_id}`
}
initialize(id=null){
if (id==null){
id=localStorage.getItem(this._id);
}
if (id!=null&&this._themes.includes(id)){
this.activate(id);
}
return this;
}
value(id){
return this.active[id];
}
opacity(id,opacity=1.0){
let full_id;
if (typeof opacity==="number"){
full_id=`${id}_opac_${opacity}`;
}else {
full_id=`${id}_opac_${Object.values(opacity).join("_")}`;
}
full_id=full_id.replaceAll(".","_");
if (this._css_vars[full_id]){
return this._css_vars[full_id];
}
let index=0;
for (const theme_id of this._themes){
const theme=this[theme_id];
if (theme[id]==null){
console.error(new Error(`Theme attribute "${id}" does not exist.`));
return;
}
if (theme[id]._is_gradient){
console.error(new Error(`Unable to set the opacity on gradient color "${id}".`));
return;
}
let theme_opac=opacity;
if (typeof theme_opac==="object"){
theme_opac=theme_opac[this._theme_ids[index]];
if (theme_opac===undefined){
console.error(new Error(`Unable to find the opacity on for theme id "${this._theme_ids[index]}".`));
}
}
theme[full_id]=vweb.colors.set_opacity(theme[id],theme_opac);
if (index===0){
this._add_attr(full_id);
}
if (this.active_id===theme_id){
document.documentElement.style.setProperty(`--${this._id}_${full_id}`,theme[full_id]);
}
++index;
}
return this._css_vars[full_id];
}
activate(id,apply_theme_update=true){
if (this._themes.includes(id)===false){
throw Error(`Theme "${id}" does not exist.`);
}
this.active_id=id;
this.active=this[id];
Object.keys(this.active).iterate((id)=>{
document.documentElement.style.setProperty(`--${this._id}_${id}`, this.active[id]);
});
if (this._on_activate_callback!=null){
this._on_activate_callback(this, this.active_id);
}
if (apply_theme_update){
vweb.themes.apply_theme_update();
}
localStorage.setItem(this._id, this.active_id);
return this;
}
on_activate(callback){
if (callback==null){return this._on_activate_callback;}
this._on_activate_callback=callback;
return this;
}
get_active_id_cached(){
return localStorage.getItem(this._id);
}
toggle(apply_theme_update=true){
if (this._theme_ids.length>1){
let active_index=null;
for (let i=0;i<this._theme_ids.length;i++){
if (this._theme_ids[i]===this.active_id){
active_index=i;
break;
}
}
if (active_index+1<this._theme_ids.length){
this.activate(this._theme_ids[active_index+1],apply_theme_update);
}else {
this.activate(this._theme_ids[0],apply_theme_update);
}
}
return this;
}
};function Themes(...args){return new ThemesClass(...args)};
class TitleElement extends CreateVElementClass({
type:"Title",
tag:"h1",
default_style:{
"margin":"0px 0px 0px 0px",
"color":"inherit",
"white-space":"wrap",
"text-align":"inherit",
"font-weight":"700",
},
}){
constructor(text){
super();
this.text(text);
}
};function Title(...args){return new TitleElement(...args)};;vweb.elements.register(TitleElement);
class SubtitleElement extends CreateVElementClass({
type:"Subtitle",
tag:"h1",
default_style:{
"margin":"0px 0px 0px 0px",
"color":"inherit",
"white-space":"wrap",
"text-align":"inherit",
"font-weight":"700",
},
}){
constructor(text){
super();
this.text(text);
}
};function Subtitle(...args){return new SubtitleElement(...args)};;vweb.elements.register(SubtitleElement);
class ViewElement extends CreateVElementClass({
type:"View",
tag:"div",
default_style:{
"position":"absolute",
"top":"0",
"right":"0",
"bottom":"0",
"left":"0",
"padding":"0px",
"display":"block",
"overflow":"hidden",
"overflow-y":"none",
"background":"none",
"display":"flex",
"align-content":"flex-start",
"flex-direction":"column",
},
}){
constructor(...children){
super();
this.append(...children);
}
};function View(...args){return new ViewElement(...args)};;vweb.elements.register(ViewElement);
class ZStackElement extends CreateVElementClass({
type:"ZStack",
tag:"div",
default_style:{
"margin":"0px",
"padding":"0px",
"display":"grid",
"outline":"none",
"border":"none",
},
}){
constructor(...children){
super();
this.zstack_append(...children);
}
append(...children){
return this.zstack_append(...children);
}
};function ZStack(...args){return new ZStackElement(...args)};;vweb.elements.register(ZStackElement);
