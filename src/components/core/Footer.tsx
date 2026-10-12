import { site } from "@/shake.config";

export default function Footer() {
  return (
    <footer style={{
      background: "#0a0603", color: "color-mix(in srgb, var(--foam) 70%, transparent)",
      paddingBlock: "clamp(3rem,7vh,5rem)",
    }}>
      <div className="shell" style={{
        display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
      }}>
        <div>
          <p style={{
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.1rem",
            color: "var(--foam)", margin: 0, letterSpacing: "-0.01em",
          }}>{site.brandName}</p>
          <p className="micro" style={{ marginTop: "0.6rem" }}>{site.tagline}</p>
        </div>
        <div>
          <p className="micro" style={{ marginBottom: "0.8rem" }}>Delivery</p>
          {site.delivery.map((d) => (
            <p key={d} style={{ margin: "0.3rem 0", fontSize: "0.84rem" }}>{d}</p>
          ))}
        </div>
        <div>
          <p className="micro" style={{ marginBottom: "0.8rem" }}>Follow</p>
          {site.socialLinks.map((s) => (
            <a key={s.name} href={s.url} style={{
              display: "block", margin: "0.3rem 0", fontSize: "0.84rem",
              color: "inherit", textDecoration: "none",
            }}>{s.name}</a>
          ))}
        </div>
        <div>
          <p className="micro" style={{ marginBottom: "0.8rem" }}>Orders</p>
          <p style={{ margin: "0.3rem 0", fontSize: "0.84rem" }}>{site.whatsapp}</p>
        </div>
      </div>
      <div className="shell" style={{
        marginTop: "3rem", paddingTop: "1.4rem", borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
      }}>
        <p className="micro">© {new Date().getFullYear()} {site.brandName}</p>
        <p className="micro">No water. Ever.</p>
      </div>
    </footer>
  );
}
