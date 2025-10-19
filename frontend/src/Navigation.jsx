import React from 'react';

function Navigation({ current, onChange }) {
  return (
    <nav style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
  <button onClick={() => onChange('cotizaciones')} style={{ padding: '8px 12px', background: current === 'cotizaciones' ? '#C2FAFF' : '#fff', color: '#213547', border: '1px solid #C2FAFF', borderRadius: 6 }}>Cotizaciones</button>
  <button onClick={() => onChange('servicios')} style={{ padding: '8px 12px', background: current === 'servicios' ? '#C2FAFF' : '#fff', color: '#213547', border: '1px solid #C2FAFF', borderRadius: 6 }}>Servicios</button>
  <button onClick={() => onChange('papelera')} style={{ padding: '8px 12px', background: current === 'papelera' ? '#C2FAFF' : '#fff', color: '#213547', border: '1px solid #C2FAFF', borderRadius: 6 }}>Papelera</button>
  <button onClick={() => onChange('informes')} style={{ padding: '8px 12px', background: current === 'informes' ? '#C2FAFF' : '#fff', color: '#213547', border: '1px solid #C2FAFF', borderRadius: 6 }}>Informes</button>
    </nav>
  );
}

export default Navigation;
