/* Lightweight video lifecycle: play only when visible, no forced full-page downloads. */
(()=>{"use strict";const videos=[...document.querySelectorAll(".sa-inline-video")];if(!videos.length)return;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const pause=(v)=>{try{v.pause()}catch(_){ }};
videos.forEach(v=>{v.removeAttribute("autoplay");v.muted=true;v.preload="none";pause(v);});
if(!("IntersectionObserver" in window)){return}
const observer=new IntersectionObserver(entries=>entries.forEach(({target:v,isIntersecting,intersectionRatio})=>{
 if(document.hidden||reduced.matches||!isIntersecting||intersectionRatio<.35){pause(v);return}
 if(v.preload==="none")v.preload="metadata";
 const result=v.play();if(result&&typeof result.catch==="function")result.catch(()=>{});
}),{threshold:[0,.35,.75],rootMargin:"120px 0px"});
videos.forEach(v=>observer.observe(v));
document.addEventListener("visibilitychange",()=>{if(document.hidden)videos.forEach(pause);else videos.forEach(v=>{if(v.getBoundingClientRect().top<innerHeight&&v.getBoundingClientRect().bottom>0&&!reduced.matches){v.play().catch(()=>{})}})});
})();