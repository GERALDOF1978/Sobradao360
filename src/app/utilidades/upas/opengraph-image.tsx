import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "UPAs Agora — Consulte as filas e os médicos de plantão pelo Sobradão 360";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex", width: "100%", height: "100%",
          background: "linear-gradient(120deg, #062f86 0%, #1161cc 60%, #00327f 100%)",
          color: "#ffffff", padding: "52px 68px",
          flexDirection: "column", justifyContent: "space-between",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 31, fontWeight: 900, letterSpacing: 1 }}>
            SOBRADÃO <span style={{ color: "#ffd61e", marginLeft: 10 }}>360</span>
          </div>
          <div style={{
            display: "flex", borderRadius: 30, padding: "12px 24px",
            background: "rgba(255,255,255,0.17)", fontSize: 23, fontWeight: 700,
          }}>
            RIO CLARO • SP
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", fontSize: 100, lineHeight: 1, fontWeight: 900, letterSpacing: -3 }}>
            UPAs <span style={{ color: "#ffda25", marginLeft: 26 }}>Agora</span>
          </div>
          <div style={{ display: "flex", fontSize: 39, fontWeight: 700, maxWidth: 1040, lineHeight: 1.2 }}>
            Acompanhe as filas e confira os médicos de plantão
          </div>
        </div>
        <div style={{
          display: "flex", background: "#ffffff", color: "#0b397e",
          padding: "24px 30px", borderRadius: 25, alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", fontSize: 27, fontWeight: 800 }}>
              Informação útil para Rio Claro
            </div>
            <div style={{ display: "flex", fontSize: 20, color: "#375579" }}>
              Abra o menu e selecione UPAs Agora
            </div>
          </div>
          <div style={{
            display: "flex", background: "#ffda25", color: "#092960",
            borderRadius: 18, padding: "17px 25px", fontSize: 25, fontWeight: 900,
          }}>
            sobradao360.com.br
          </div>
        </div>
      </div>
    ),
    size
  );
}
