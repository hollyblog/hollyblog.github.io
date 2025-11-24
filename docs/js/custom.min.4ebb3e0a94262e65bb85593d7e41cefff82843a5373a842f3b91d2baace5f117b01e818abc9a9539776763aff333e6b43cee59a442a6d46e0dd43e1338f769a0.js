(function(){"use strict";function e(){s(),o(),i(),a()}function s(){const e=document.querySelector("header");if(!e)return;let n=0,t=!1;window.addEventListener("scroll",function(){n=window.pageYOffset||document.documentElement.scrollTop,t||(window.requestAnimationFrame(function(){s(n),t=!1}),t=!0)});function s(t){t>50?(e.style.background="rgba(52, 73, 94, 0.98)",e.style.boxShadow="0 2px 12px rgba(0, 0, 0, 0.2)"):(e.style.background="rgba(52, 73, 94, 0.9)",e.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)")}}function o(){document.querySelectorAll('a[href^="#"]').forEach(e=>{e.addEventListener("click",function(e){const t=this.getAttribute("href");if(t==="#")return;const n=document.querySelector(t);n&&(e.preventDefault(),n.scrollIntoView({behavior:"smooth",block:"start"}))})})}function i(){const e=document.querySelectorAll(".article-card");if(e.length===0)return;const n={threshold:.1,rootMargin:"0px 0px -50px 0px"},t=new IntersectionObserver(function(e){e.forEach(e=>{e.isIntersecting&&(e.target.style.opacity="0",e.target.style.transform="translateY(20px)",setTimeout(()=>{e.target.style.transition="opacity 0.6s ease, transform 0.6s ease",e.target.style.opacity="1",e.target.style.transform="translateY(0)"},100),t.unobserve(e.target))})},n);e.forEach((e,n)=>{e.style.transitionDelay=`${n*.1}s`,t.observe(e)})}function a(){const e=document.querySelectorAll("img[data-src]");if(e.length===0)return;const t=new IntersectionObserver(function(e){e.forEach(e=>{if(e.isIntersecting){const n=e.target;n.src=n.dataset.src,n.removeAttribute("data-src"),t.unobserve(n)}})});e.forEach(e=>t.observe(e))}function t(){const e=document.createElement("button");e.innerHTML="↑",e.className="back-to-top",e.setAttribute("aria-label","返回顶部"),e.style.cssText=`
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(52, 116, 187, 0.9);
      color: white;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `,document.body.appendChild(e),window.addEventListener("scroll",function(){window.pageYOffset>300?(e.style.opacity="1",e.style.visibility="visible"):(e.style.opacity="0",e.style.visibility="hidden")}),e.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})}),e.addEventListener("mouseenter",function(){this.style.transform="scale(1.1)",this.style.background="rgba(52, 116, 187, 1)"}),e.addEventListener("mouseleave",function(){this.style.transform="scale(1)",this.style.background="rgba(52, 116, 187, 0.9)"})}function n(){const e=document.querySelector('input[type="search"]');if(!e)return;e.addEventListener("focus",function(){this.parentElement.style.boxShadow="0 0 0 3px rgba(52, 152, 219, 0.3)"}),e.addEventListener("blur",function(){this.parentElement.style.boxShadow="none"})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e(),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t):t(),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",n):n()})()