import React, { useState } from 'react';
import CotizacionForm from './CotizacionForm';
import CotizacionesList from './CotizacionesList';
import ServiciosList from './ServiciosList';
import ServiciosBorrados from './ServiciosBorrados';
import Navigation from './Navigation';
import CotizacionesBorradas from './CotizacionesBorradas';
import Informes from './Informes';

function MainViews() {
  const [view, setView] = useState('cotizaciones');

  return (
    <div className="main-content">
      <Navigation current={view} onChange={setView} />

      {view === 'cotizaciones' && (
        <div>
          <CotizacionForm onCreated={() => { window.location.reload(); }} />
          <CotizacionesList />
        </div>
      )}

      {view === 'servicios' && (
        <div>
          <ServiciosList />
        </div>
      )}

      {view === 'papelera' && (
        <div>
          <ServiciosBorrados />
          <CotizacionesBorradas />
        </div>
      )}

      {view === 'informes' && (
        <div>
          <Informes />
        </div>
      )}
    </div>
  );
}

export default MainViews;
