import React, { useEffect, useState } from "react";

function ServiciosBorrados() {
  const [borrados, setBorrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/servicios-borrados")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar servicios borrados");
        return res.json();
      })
      .then((data) => {
        setBorrados(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id_borrado) => {
    if (!window.confirm("¿Eliminar definitivamente este servicio?")) return;
    try {
      const res = await fetch(`http://localhost:3000/servicios-borrados/${id_borrado}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Error al eliminar definitivamente");
      setBorrados((prev) => prev.filter((s) => s.id_borrado !== id_borrado));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Cargando servicios borrados...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ marginTop: 40 }}>
      <h2>Servicios de mantención</h2>
      {borrados.length === 0 ? (
        <p>No hay servicios en la papelera.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #b3e0fc", color: "#000", padding: "8px" }}>ID Borrado</th>
              <th style={{ border: "1px solid #b3e0fc", color: "#000", padding: "8px" }}>ID Original</th>
              <th style={{ border: "1px solid #b3e0fc", color: "#000", padding: "8px" }}>Tipo</th>
              <th style={{ border: "1px solid #b3e0fc", color: "#000", padding: "8px" }}>Descripción</th>
              <th style={{ border: "1px solid #b3e0fc", color: "#000", padding: "8px" }}>Estado</th>
              <th style={{ border: "1px solid #b3e0fc", color: "#000", padding: "8px" }}>Fecha Ingreso</th>
              <th style={{ border: "1px solid #b3e0fc", color: "#000", padding: "8px" }}>Fecha Entrega</th>
              <th style={{ border: "1px solid #b3e0fc", color: "#000", padding: "8px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {borrados.map((s, idx) => (
              <tr key={s.id_borrado} style={{ borderBottom: "1px solid #b3e0fc", background: idx % 2 === 0 ? "#f8fbfd" : "#fff" }}>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>{s.id_borrado}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>{s.id_original}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px" }}>{s.tipo}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px" }}>{s.descripcion}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>{s.estado}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>{s.fechaIngreso}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>{s.fechaEntrega || "-"}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>
                  <button onClick={() => handleDelete(s.id_borrado)} className="btn-danger small">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ServiciosBorrados;
