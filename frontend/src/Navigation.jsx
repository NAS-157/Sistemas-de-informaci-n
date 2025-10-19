import React from 'react';

function Navigation({ current, onChange }) {
  return (
    <nav style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
  <button onClick={() => onChange('cotizaciones')} className={`nav-btn ${current === 'cotizaciones' ? 'active' : ''}`}>Cotizaciones</button>
  <button onClick={() => onChange('servicios')} className={`nav-btn ${current === 'servicios' ? 'active' : ''}`}>Servicios</button>
  <button onClick={() => onChange('papelera')} className={`nav-btn ${current === 'papelera' ? 'active' : ''}`}>Papelera</button>
  <button onClick={() => onChange('informes')} className={`nav-btn ${current === 'informes' ? 'active' : ''}`}>Informes</button>
    </nav>
  );
}

export default Navigation;
