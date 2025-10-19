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
    <div className="App" style={{ width: '100%', minHeight: '100vh', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <img src="/pestaña.png" alt="logo" style={{ width: 48, height: 48 }} />
          <h1 className="app-title">SEVEN ELECTRIC</h1>
        </div>
        <MainViews />
      </div>
    </div>
  );
}

// 9️⃣ Exportamos App para que React pueda usarlo
export default App;
