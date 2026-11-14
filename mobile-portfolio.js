/* AL SAFA — preserve the original overlay and marquee handlers; add accessibility. */
(()=>{"use strict";
const modal=document.getElementById("ov"),close=document.getElementById("ovx");
const grid=document.getElementById("grid");
if(!modal||!close||!grid)return;
let returnFocus=null;
const openers=document.querySelectorAll('.ticker-card[href^="#"],#grid .w[href^="#"],.sa-video-card[href^="#"]');
openers.forEach(link=>{
  link.addEventListener("click",()=>{returnFocus=link;});
});
const observer=new MutationObserver(()=>{
 const opened=modal.classList.contains("open");
 modal.setAttribute("aria-hidden",opened?"false":"true");
 if(opened){close.focus({preventScroll:true});}
 else if(returnFocus&&document.contains(returnFocus)){returnFocus.focus({preventScroll:true});returnFocus=null;}
});
modal.setAttribute("aria-hidden",modal.classList.contains("open")?"false":"true");
observer.observe(modal,{attributes:true,attributeFilter:["class"]});
const label=modal.querySelector("#ovt");
if(label){label.id="ovt";modal.setAttribute("aria-labelledby","ovt");}
const gallery=modal.querySelector("#ovb");
gallery?.setAttribute("aria-label","صور المشروع بترتيب عمودي");
document.querySelectorAll('.ticker-card[href^="#"]').forEach(link=>{
 link.setAttribute("aria-label","استعرض مشروع "+(link.querySelector("img")?.alt||""));
});
})();