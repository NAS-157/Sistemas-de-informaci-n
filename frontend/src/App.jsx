// 1️⃣ Importamos React y useState para manejar el estado de la aplicación
import { useState } from "react";
import ServiciosList from "./ServiciosList";
import ServiciosBorrados from "./ServiciosBorrados";
import CotizacionForm from "./CotizacionForm";
import CotizacionesList from "./CotizacionesList";
import Navigation from "./Navigation";
import MainViews from "./MainViews";

// 3️⃣ Función principal de React: App
function App() {
  // useState nos permite guardar cuál producto se muestra en grande
  const [index, setIndex] = useState(0);

  return (
    // 4️⃣ Contenedor principal centrado usando Flexbox
    <div
      className="App"
      style={{
        background: "#fff", // Fondo blanco
        color: "#000",   // Texto negro por defecto
        minHeight: "100vh", // Ocupa toda la altura de la pantalla
        minWidth: "100vw",  // Ocupa toda la anchura de la pantalla
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif", // Fuente agradable
        boxSizing: "border-box"
      }}
    >
      <div style={{ width: "100%", maxWidth: 900, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
  <h1 style={{ color: "#2196f3", textAlign: "center" }}>SEVEN ELECTRIC - GESTOR DE SERVICIOS</h1>
  <MainViews />
      </div>
    </div>
  );
}

// 9️⃣ Exportamos App para que React pueda usarlo
export default App;
