/* AL SAFA | defensive enhancements | 2026-11-14 */
(()=>{"use strict";
 const images=document.querySelectorAll("img");
 images.forEach((img)=>{
   img.decoding="async";
   if(!img.hasAttribute("loading")&&!img.closest(".hero,header,.cinematic-intro")) img.loading="lazy";
   img.addEventListener("error",()=>{img.classList.add("media-unavailable");},{once:true});
 });
 // Save CPU when the tab is hidden; do not alter animation layout or existing event handlers.
 document.addEventListener("visibilitychange",()=>{
   document.documentElement.classList.toggle("page-inactive",document.hidden);
 });
 const style=document.createElement("style");
 style.textContent=".page-inactive .band p,.page-inactive .ticker-track,.page-inactive .sa-wheel-track{animation-play-state:paused!important}";
 document.head.append(style);
})();
