export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#dff3ff", // azul cielo
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem", color: "#0f172a" }}>
        Kendall South Credentialing
      </h1>
      <p style={{ fontSize: "1rem", color: "#1f2933" }}>
        Home en azul cielo funcionando en Vercel.
      </p>
    </main>
  );
}
