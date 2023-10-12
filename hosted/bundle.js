(()=>{var e={867:(e,n,t)=>{const{clientHeaders:a}=t(17),{boardHeight:r,boardWidth:o,browserDoesntSupportCanvas:i,initCtxLineProps:s,endLine:c,moveLine:d,startLine:l,getImageDataBuffer:g,drawImageDataBuffer:m,clear:u}=t(548);let w,f,p,v,b=!1;const h=(e,{x:n,y:t})=>{const a=new ArrayBuffer(17),r=new DataView(a);r.setUint8(0,e),r.setFloat64(1,n),r.setFloat64(9,t),v.send(a)},D=e=>{const n={};let t,a;switch(e.type){case"touchdown":case"touchmove":t=e.touches[0].pageX,a=e.touches[0].pageY;break;default:t=e.pageX,a=e.pageY}return n.x=(t-f.offsetLeft)*(o/f.offsetWidth),n.y=(a-f.offsetTop)*(r/f.offsetHeight),n},L=e=>{if(b)return;b=!0;const n=D(e);l(p,n),h(a.penDown,n)},y=e=>{if(!b)return;const n=D(e);d(p,n),h(a.penMove,n)},E=()=>{b&&(b=!1,c(p),v.send(new Uint8Array([a.penUp]).buffer))},x=()=>g(p);e.exports={init:()=>(w=document.querySelector("#drawingBoard"),f=document.querySelector("#drawingBoardOuter"),!i(w)&&(p=w.getContext("2d"),f.onmousedown=L,f.onmousemove=y,f.onmouseup=E,f.onmouseout=E,f.ontouchstart=L,f.ontouchend=E,f.ontouchmove=y,f.ontouchcancel=E,s(p),!0)),toDataURL:()=>w.toDataURL(),getImageDataBuffer:x,drawImageDataBuffer:e=>m(p,e),submitDrawing:()=>{v.send(new Uint8Array([a.submitDrawing,...x()]).buffer)},clear:()=>u(p),setSocket:e=>{v=e}}},474:(e,n,t)=>{const{browserDoesntSupportCanvas:a,initCtxLineProps:r,endLine:o,moveLine:i,startLine:s,drawImageDataBuffer:c,clear:d}=t(548);let l,g;e.exports={init:()=>(l=document.querySelector("#streamingBoard"),!a(l)&&(g=l.getContext("2d"),r(g),!0)),startLine:e=>{s(g,e)},moveLine:e=>{i(g,e)},endLine:()=>{o(g)},toDataURL:()=>l.toDataURL(),drawImageDataBuffer:e=>c(g,e),clear:()=>d(g)}},548:e=>{const n=512,t=512,a=(e,{x:n,y:t})=>{e.lineTo(n,t),e.stroke()};e.exports={boardHeight:t,boardWidth:n,browserDoesntSupportCanvas:e=>!(e.getContext&&e.getContext("2d")&&e.toDataURL&&e.toDataURL()),initCtxLineProps:e=>{e.lineWidth=3,e.strokeStyle="black",e.lineCap="round",e.lineJoin="round"},endLine:e=>{e.closePath()},moveLine:a,startLine:(e,{x:n,y:t})=>{e.beginPath(),e.moveTo(n,t),a(e,{x:n,y:t})},getImageDataBuffer:e=>e.getImageData(0,0,n,t).data,drawImageDataBuffer:(e,a)=>{e.putImageData(new ImageData(new Uint8ClampedArray(a),n,t),0,0)},clear:e=>{const a=e.fillStyle;e.fillStyle="white",e.fillRect(0,0,n,t),e.fillStyle=a}}},280:e=>{e.exports={otherOfTwoPlayers:e=>0===e?1:0}},136:e=>{const n="ABCDEFGHIJKLMNOPQRSTUVWXYZ";e.exports={makeNewCode:e=>{let t;do{t="";for(let e=0;e<3;e++)t+=n[Math.floor(26*Math.random())]}while(e&&e[t]);return t},validateCode:(e,t,a)=>{if(!e)return"No game code specified.";const r=e.length;for(let t=0;t<r;t++){const a=e[t];if(!n.includes(a))return"Invalid game code character(s)."}if(3!==r)return"Invalid game code length.";if(t){if(!t[e])return`No game with code ${e} has been created.`;if(a&&0!==t[e].state)return`The game with code ${e} is already in progress.`}return null}}},17:e=>{e.exports={clientHeaders:{newGame:0,joinGame:1,submitDrawing:2,penDown:3,penMove:4,penUp:5,updateReady:6},serverHeaders:{errorMsg:0,newGameCreated:1,gameStarting:2,drawingDone:3,penDown:4,penMove:5,penUp:6,aiGenerationDone:7}}}},n={};function t(a){var r=n[a];if(void 0!==r)return r.exports;var o=n[a]={exports:{}};return e[a](o,o.exports,t),o.exports}(()=>{const e=t(136),n=t(867),a=t(474),{clientHeaders:r,serverHeaders:o}=t(17),{otherOfTwoPlayers:i}=t(280),s=`ws://${window.location.hostname}:3000`;let c,d,l,g={},m={};const u=e=>{const n=new DataView(e),t=n.getUint8(0),a={header:t};switch(t){case o.errorMsg:case o.newGameCreated:case o.aiGenerationDone:a.string=String.fromCharCode(...new Uint8Array(e).slice(1));break;case o.gameStarting:a.round=n.getUint8(1),a.whoScribbles=n.getUint8(2);break;case o.penDown:case o.penMove:a.player=n.getUint8(1),a.mouse={x:n.getFloat64(2),y:n.getFloat64(10)};break;case o.penUp:a.player=n.getUint8(1);break;case o.drawingDone:a.player=n.getUint8(1),a.imageDataBuffer=e.slice(2)}return a},w=(e,n)=>{const t=n||(e=>e),a={};for(let n=0;n<e.length;n++){const r=e[n];a[r]=document.querySelector(`#${t(r)}`)}return a},f=e=>{g[e]&&Object.keys(g).forEach((n=>{g[n].classList.toggle("activeScreen",n===e)}))},p=(e,t,s,g,w)=>{const v=i(g),b=()=>{f("waitingForAi");const n=a=>{const r=u(a.data);if(r.header===o.aiGenerationDone){t.removeEventListener("message",n),l=r.string,m.finalScribble.src=c,m.finalExpension.src=d,m.finalAiSuperExpension.src=l,m.saveDrawingsButton.onclick=()=>{(e=>{const n=t=>{if(t>=e.length)return;const a=e[t],r=document.createElement("a");r.href=a.url,r.target="_blank","download"in r&&(r.download=a.filename),(document.body||document.documentElement).appendChild(r),r.click(),r.remove(),setTimeout((()=>n(t+1)),500)};n(0)})([{url:c,filename:`expensiongame_${e}_round${s+1}_1`},{url:d,filename:`expensiongame_${e}_round${s+1}_2`},{url:l,filename:`expensiongame_${e}_round${s+1}_3`}])},f("done");const a=n=>{const r=u(n.data);r.header===o.gameStarting&&(t.removeEventListener("message",a),p(e,t,r.round,r.whoScribbles,w))};t.addEventListener("message",a)}};t.addEventListener("message",n)};if(m.finalScribble.classList.remove("finalDrawingActive"),m.finalExpension.classList.remove("finalDrawingActive"),m.finalAiSuperExpension.classList.add("finalDrawingActive"),m.showFinalAiSuperExpension.click(),m.playAgainCheckbox.checked=!1,c=void 0,d=void 0,l=void 0,m.whyAmIWaiting.innerHTML="Waiting for the other player to make a scribble...",m.whatAmIDrawing.innerHTML="Make a scribble!",a.clear(),n.clear(),m.playAgainCheckbox.onclick=e=>{t.send(new Uint8Array([r.updateReady,e.target.checked?1:0]).buffer)},g===w)f("drawing"),m.submitDrawingButton.onclick=()=>{c=n.toDataURL(),a.drawImageDataBuffer(n.getImageDataBuffer()),n.submitDrawing(),m.whyAmIWaiting.innerHTML="Waiting for the other player to make an exPENsion of your scribble...",f("waitingForDrawing");const e=n=>{const r=u(n.data);if(r.player===v)switch(r.header){case o.penDown:a.startLine(r.mouse);break;case o.penMove:a.moveLine(r.mouse);break;case o.penUp:a.endLine();break;case o.drawingDone:t.removeEventListener("message",e),a.drawImageDataBuffer(r.imageDataBuffer),d=a.toDataURL(),b()}};t.addEventListener("message",e)};else{f("waitingForDrawing");const e=r=>{const i=u(r.data);if(i.player===g)switch(i.header){case o.penDown:a.startLine(i.mouse);break;case o.penMove:a.moveLine(i.mouse);break;case o.penUp:a.endLine();break;case o.drawingDone:t.removeEventListener("message",e),n.drawImageDataBuffer(i.imageDataBuffer),c=n.toDataURL(),m.submitDrawingButton.onclick=()=>{d=n.toDataURL(),n.submitDrawing(),b()},m.whatAmIDrawing.innerHTML="It's exPENsion time! Turn this scribble into a coherent drawing!",f("drawing")}};t.addEventListener("message",e)}};window.onload=()=>{g=w(["start","displayCode","inputCode","waitingForDrawing","drawing","waitingForAi","done","noCanvas"],(e=>`${e}Screen`)),m=w(["newGameButton","newGameError","joinGameButton","codeDisplay","codeInput","submitJoinCodeButton","joinError","whyAmIWaiting","whatAmIDrawing","submitDrawingButton","finalScribble","finalExpension","finalAiSuperExpension","finalDrawingForm","showFinalAiSuperExpension","saveDrawingsButton","playAgainCheckbox"]),n.init()&&a.init()||f("noCanvas");const t=e=>{m.newGameButton.disabled=e,m.joinGameButton.disabled=e,m.submitJoinCodeButton.disabled=e,m.codeInput.disabled=e},i=()=>{t(!1),f("start"),m.newGameError.innerHTML="Connection lost."};m.newGameButton.onclick=()=>{m.newGameError.innerHTML="",t(!0);const e=new WebSocket(s);e.binaryType="arraybuffer",e.addEventListener("open",(()=>{e.send(new Uint8Array([r.newGame]).buffer)})),e.addEventListener("close",i),n.setSocket(e);const a=n=>{const r=u(n.data),{header:s}=r;if(e.removeEventListener("message",a),s===o.errorMsg)t(!1),m.newGameError.innerHTML=r.string,e.removeEventListener("close",i),e.close();else if(s===o.newGameCreated){const n=r.string;m.codeDisplay.innerHTML=n,f("displayCode");const t=a=>{const r=u(a.data);e.removeEventListener("message",t),p(n,e,r.round,r.whoScribbles,0)};e.addEventListener("message",t)}};e.addEventListener("message",a)},m.joinGameButton.onclick=()=>f("inputCode");const c=()=>{m.joinError.innerHTML="",t(!0);const a=m.codeInput.value.toUpperCase(),c=e.validateCode(a);if(c)t(!1),m.joinError.innerHTML=c.message;else{const e=new WebSocket(s);e.binaryType="arraybuffer",e.addEventListener("open",(()=>{e.send(((e,[...n])=>new Uint8Array([e,...n.map((e=>e.charCodeAt(0)))]).buffer)(r.joinGame,a))})),e.addEventListener("close",i),n.setSocket(e);const c=n=>{const r=u(n.data),{header:s}=r;e.removeEventListener("message",c),s===o.errorMsg?(t(!1),m.joinError.innerHTML=r.string,e.removeEventListener("close",i),e.close()):s===o.gameStarting&&(m.codeInput.value="",p(a,e,r.round,r.whoScribbles,1))};e.addEventListener("message",c)}};m.submitJoinCodeButton.onclick=c,m.codeInput.onkeypress=e=>{"Enter"===(e.code||e.key)&&c()};const d=e=>()=>{m.finalScribble.classList["showFinalScribble"===e?"add":"remove"]("finalDrawingActive"),m.finalExpension.classList["showFinalExpension"===e?"add":"remove"]("finalDrawingActive"),m.finalAiSuperExpension.classList["showFinalAiSuperExpension"===e?"add":"remove"]("finalDrawingActive")},l=m.finalDrawingForm.children;for(let e=0;e<l.length;e++){const n=l[e],t=d(n.querySelector("input").id),a=n.children;for(let e=0;e<a.length;e++)a[e].addEventListener("click",t)}}})()})();