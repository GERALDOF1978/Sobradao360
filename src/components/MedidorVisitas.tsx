"use client";
import { useEffect } from "react";
export default function MedidorVisitas() {
  useEffect(() => {
    let sid = "";
    try {
      sid = localStorage.getItem("sobradao360_sid") || "";
      if(!/^[a-f0-9]{32}$/.test(sid)) {
        sid = Array.from(crypto.getRandomValues(new Uint8Array(16)), x => x.toString(16).padStart(2,"0")).join("");
        localStorage.setItem("sobradao360_sid",sid);
      }
    } catch {return;}
    const enviar = () => {if(document.visibilityState==="visible") void fetch("/api/metricas-visitas",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sid}),keepalive:true}).catch(()=>{});};
    enviar();
    const timer = window.setInterval(enviar,60000);
    document.addEventListener("visibilitychange",enviar);
    return () => {clearInterval(timer);document.removeEventListener("visibilitychange",enviar);};
  },[]);
  return null;
}
