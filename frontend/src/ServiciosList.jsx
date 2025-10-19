import React, { useEffect, useState } from "react";

function ServiciosList() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para el formulario
  const [form, setForm] = useState({
    tipo: "",
    descripcion: "",
    estado: "en proceso",
    fechaIngreso: ""
  });
  const [formError, setFormError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/servicios")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar servicios");
        return res.json();
      })
      .then((data) => {
        setServicios(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.tipo || !form.descripcion || !form.fechaIngreso) {
      setFormError("Todos los campos son obligatorios");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("http://localhost:3000/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Error al registrar servicio");
      const nuevo = await res.json();
      setServicios((prev) => [...prev, nuevo]);
      setForm({ tipo: "", descripcion: "", estado: "en proceso", fechaIngreso: "" });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  // Mover servicio a la papelera con motivo (cancelado/terminado)
  const handleMoveToPaper = async (id, motivo) => {
    if (!['cancelado', 'terminado'].includes(motivo)) return;
    if (!window.confirm(`¿Confirma mover el servicio ${id} como '${motivo}'?`)) return;
    try {
      const res = await fetch(`http://localhost:3000/servicios/${id}?motivo=${encodeURIComponent(motivo)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al mover servicio');
      setServicios((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Cargando servicios...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Registrar nuevo servicio</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        <div>
          <label>Tipo de servicio: </label>
          <select name="tipo" value={form.tipo} onChange={handleChange} required>
            <option value="">Selecciona un tipo</option>
            <option value="mantencion de vehiculos electricos">Mantención de vehículos eléctricos</option>
            <option value="mantencion de transpaletas">Mantención de transpaletas</option>
            <option value="cambio de mangueras hidraulicas">Cambio de mangueras hidráulicas</option>
            <option value="reparacion de cilindros hidraulicos">Reparación de cilindros hidráulicos</option>
            <option value="mantencion de motores">Mantención de motores</option>
            <option value="mantencion de gruas a combustion">Mantención de grúas a combustión</option>
            <option value="diagnostico de baterias">Diagnóstico de baterías</option>
            <option value="cambio de neumaticos">Cambio de neumáticos</option>
            <option value="asistencia en terreno">Asistencia en terreno</option>
          </select>
        </div>
        <div>
          <label>Descripción: </label>
          <input name="descripcion" value={form.descripcion} onChange={handleChange} required />
        </div>
        <div>
          <label>Fecha de ingreso: </label>
          <input type="date" name="fechaIngreso" value={form.fechaIngreso} onChange={handleChange} required />
        </div>
        <button type="submit" disabled={enviando} style={{ marginTop: 10, color: '#213547', background: '#C2FAFF', border: 'none', borderRadius: 6, padding: '8px 12px', cursor: 'pointer' }}>
          {enviando ? "Registrando..." : "Registrar servicio"}
        </button>
        {formError && <p style={{ color: "red" }}>{formError}</p>}
      </form>

      <h2>Servicios de Mantención</h2>
      {servicios.length === 0 ? (
        <p>No hay servicios registrados.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #b3e0fc", borderBottom: "2px solid #2196f3", color: "#000", padding: "8px" }}>ID</th>
              <th style={{ border: "1px solid #b3e0fc", borderBottom: "2px solid #2196f3", color: "#000", padding: "8px" }}>Tipo</th>
              <th style={{ border: "1px solid #b3e0fc", borderBottom: "2px solid #2196f3", color: "#000", padding: "8px" }}>Descripción</th>
              <th style={{ border: "1px solid #b3e0fc", borderBottom: "2px solid #2196f3", color: "#000", padding: "8px" }}>Estado</th>
              <th style={{ border: "1px solid #b3e0fc", borderBottom: "2px solid #2196f3", color: "#000", padding: "8px" }}>Fecha Ingreso</th>
              <th style={{ border: "1px solid #b3e0fc", borderBottom: "2px solid #2196f3", color: "#000", padding: "8px" }}>Fecha Entrega</th>
              <th style={{ border: "1px solid #b3e0fc", borderBottom: "2px solid #2196f3", color: "#000", padding: "8px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s, idx) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #b3e0fc", background: idx % 2 === 0 ? "#f8fbfd" : "#fff" }}>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>{s.id}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px" }}>{s.tipo}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px" }}>{s.descripcion}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>{s.estado}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>{s.fechaIngreso}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center" }}>{s.fechaEntrega || "-"}</td>
                <td style={{ border: "1px solid #b3e0fc", padding: "8px", textAlign: "center", display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={() => handleMoveToPaper(s.id, 'terminado')} style={{ color: '#213547', background: '#C2FAFF', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Terminado</button>
                  <button onClick={() => handleMoveToPaper(s.id, 'cancelado')} style={{ color: '#213547', background: '#FA8787', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Cancelado</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ServiciosList;
