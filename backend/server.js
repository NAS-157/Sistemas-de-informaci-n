const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

// Conexión a SQLite
const dbPath = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite");
  }
});

// TABLA DE SERVICIOS
const createServiciosTable = `
CREATE TABLE IF NOT EXISTS servicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL,
  fechaIngreso TEXT NOT NULL,
  fechaEntrega TEXT
);
`;
db.run(createServiciosTable, (err) => {
  if (err) {
    console.error("Error al crear la tabla de servicios:", err.message);
  }
});

// TABLA DE SERVICIOS BORRADOS
const createServiciosBorradosTable = `
CREATE TABLE IF NOT EXISTS servicios_borrados (
  id_borrado INTEGER PRIMARY KEY AUTOINCREMENT,
  id_original INTEGER,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL,
  fechaIngreso TEXT NOT NULL,
  fechaEntrega TEXT
);
`;
db.run(createServiciosBorradosTable, (err) => {
  if (err) {
    console.error("Error al crear la tabla de servicios_borrados:", err.message);
  }
});

// Asegurar columna fecha_borrado en servicios_borrados
db.run("ALTER TABLE servicios_borrados ADD COLUMN fecha_borrado TEXT", (err) => {
  // Si ya existe la columna, sqlite lanzará un error que ignoramos
});

// Simulación de base de datos en memoria
let productos = [
  { id: 1, nombre: "Cable eléctrico", stock: 50 },
  { id: 2, nombre: "Interruptor", stock: 30 },
  { id: 3, nombre: "Enchufe", stock: 20 }
];

// Obtener todos los productos
app.get("/productos", (req, res) => {
  res.json(productos);
});

// Agregar un producto
app.post("/productos", (req, res) => {
  const { nombre, stock } = req.body;
  if (!nombre || stock == null) {
    return res.status(400).json({ error: "Faltan datos" });
  }
  const nuevoProducto = {
    id: productos.length ? productos[productos.length - 1].id + 1 : 1,
    nombre,
    stock: Number(stock)
  };
  productos.push(nuevoProducto);
  res.status(201).json(nuevoProducto);
});

// Eliminar un producto
app.delete("/productos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = productos.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  const eliminado = productos.splice(index, 1);
  res.json(eliminado[0]);
});

// Consultar stock de un producto
app.get("/productos/:id/stock", (req, res) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);
  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  res.json({ id: producto.id, nombre: producto.nombre, stock: producto.stock });
});

// Obtener todos los servicios (desde la base de datos)
app.get("/servicios", (req, res) => {
  db.all("SELECT * FROM servicios", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Registrar un nuevo servicio usando la ID más baja disponible
app.post("/servicios", (req, res) => {
  const { tipo, descripcion, estado, fechaIngreso } = req.body;
  if (!tipo || !descripcion || !estado || !fechaIngreso) {
    return res.status(400).json({ error: "Faltan datos" });
  }
  // Buscar la ID más baja disponible
  db.all("SELECT id FROM servicios ORDER BY id", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    let nextId = 1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id !== i + 1) {
        nextId = i + 1;
        break;
      }
      nextId = rows.length + 1;
    }
    // Insertar el nuevo servicio con la ID calculada
    const sql = `INSERT INTO servicios (id, tipo, descripcion, estado, fechaIngreso, fechaEntrega) VALUES (?, ?, ?, ?, ?, NULL)`;
    db.run(sql, [nextId, tipo, descripcion, estado, fechaIngreso], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      db.get("SELECT * FROM servicios WHERE id = ?", [nextId], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(row);
      });
    });
  });
});

// Cambiar el estado de un servicio (en la base de datos)
app.patch("/servicios/:id/estado", (req, res) => {
  const id = parseInt(req.params.id);
  const { estado, fechaEntrega } = req.body;
  db.get("SELECT * FROM servicios WHERE id = ?", [id], (err, servicio) => {
    if (err || !servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    const nuevoEstado = estado || servicio.estado;
    const nuevaFechaEntrega = fechaEntrega || servicio.fechaEntrega;
    db.run(
      "UPDATE servicios SET estado = ?, fechaEntrega = ? WHERE id = ?",
      [nuevoEstado, nuevaFechaEntrega, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        db.get("SELECT * FROM servicios WHERE id = ?", [id], (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        });
      }
    );
  });
});

// Consultar un servicio específico (desde la base de datos)
app.get('/servicios/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválida' });
  db.get('SELECT * FROM servicios WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(row);
  });
});

// Endpoint de informes: CSV de servicios filtrable por fecha y estado
// Parámetros: desde (YYYY-MM-DD), hasta (YYYY-MM-DD), estado (texto), preview=true (devuelve JSON en vez de CSV)
// Endpoint de informes: CSV de servicios borrados en los últimos 30 días (filtrable por fecha original y estado)
// Parámetros: desde (YYYY-MM-DD), hasta (YYYY-MM-DD), estado (texto), preview=true (devuelve JSON en vez de CSV)
app.get('/informes/servicios', (req, res) => {
  const { desde, hasta, estado, preview } = req.query;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let sql = 'SELECT id_borrado, id_original, tipo, descripcion, estado, fechaIngreso, fechaEntrega, fecha_borrado FROM servicios_borrados WHERE fecha_borrado >= ?';
  const params = [thirtyDaysAgo];
  if (desde) { sql += ' AND fechaIngreso >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND fechaIngreso <= ?'; params.push(hasta); }
  if (estado) { sql += ' AND estado = ?'; params.push(estado); }
  sql += ' ORDER BY fecha_borrado DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (preview === 'true') return res.json(rows);
    // Generar CSV con marcación de borrado
    const headers = ['id_borrado','id_original','tipo','descripcion','estado','fechaIngreso','fechaEntrega','fecha_borrado'];
    const escape = (v) => (v == null ? '' : '"' + String(v).replace(/"/g,'""') + '"');
    const lines = [headers.join(',')];
    for (const r of rows) {
      const row = [r.id_borrado, r.id_original, r.tipo, r.descripcion, r.estado, r.fechaIngreso, r.fechaEntrega, r.fecha_borrado].map(escape).join(',');
      lines.push(row);
    }
    const csv = lines.join('\n');
    const filename = `servicios_borrados_${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  });
});

// ------------------ COTIZACIONES ------------------
// Tabla: cotizaciones (id, cliente, items JSON, total, estado, fecha)
const createCotizacionesTable = `
CREATE TABLE IF NOT EXISTS cotizaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT NOT NULL,
  items TEXT NOT NULL,
  total REAL NOT NULL,
  estado TEXT NOT NULL,
  fecha TEXT NOT NULL
);
`;
db.run(createCotizacionesTable, (err) => {
  if (err) console.error("Error creando tabla cotizaciones:", err.message);
});

// Tabla: cotizaciones_borradas (historial de cotizaciones rechazadas)
const createCotizacionesBorradasTable = `
CREATE TABLE IF NOT EXISTS cotizaciones_borradas (
  id_borrado INTEGER PRIMARY KEY AUTOINCREMENT,
  id_original INTEGER,
  cliente TEXT NOT NULL,
  items TEXT NOT NULL,
  total REAL NOT NULL,
  estado TEXT NOT NULL,
  fecha TEXT NOT NULL
);
`;
db.run(createCotizacionesBorradasTable, (err) => {
  if (err) console.error("Error creando tabla cotizaciones_borradas:", err.message);
});

// Asegurar columna fecha_borrado en cotizaciones_borradas
db.run("ALTER TABLE cotizaciones_borradas ADD COLUMN fecha_borrado TEXT", (err) => {
  // Ignorar errores por columna existente
});

// Listar cotizaciones
app.get('/cotizaciones', (req, res) => {
  db.all('SELECT * FROM cotizaciones ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // parse items JSON
    const parsed = rows.map(r => ({ ...r, items: JSON.parse(r.items) }));
    res.json(parsed);
  });
});

// Crear cotización
app.post('/cotizaciones', (req, res) => {
  const { cliente, items, total, fecha } = req.body;
  if (!cliente || !items || total == null || !fecha) return res.status(400).json({ error: 'Faltan datos' });
  const sql = 'INSERT INTO cotizaciones (cliente, items, total, estado, fecha) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [cliente, JSON.stringify(items), total, 'pendiente', fecha], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM cotizaciones WHERE id = ?', [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      row.items = JSON.parse(row.items);
      res.status(201).json(row);
    });
  });
});

// Cambiar estado de cotización
app.patch('/cotizaciones/:id/estado', (req, res) => {
  const id = parseInt(req.params.id);
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ error: 'Falta estado' });
  // Si la nueva estado es 'rechazada', mover la cotización a cotizaciones_borradas
  if (estado === 'rechazada') {
    db.get('SELECT * FROM cotizaciones WHERE id = ?', [id], (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Cotización no encontrada' });
      const sqlInsert = 'INSERT INTO cotizaciones_borradas (id_original, cliente, items, total, estado, fecha) VALUES (?, ?, ?, ?, ?, ?)';
      const fechaBorrado = new Date().toISOString();
      const sqlInsertWithFecha = 'INSERT INTO cotizaciones_borradas (id_original, cliente, items, total, estado, fecha, fecha_borrado) VALUES (?, ?, ?, ?, ?, ?, ?)';
      db.run(sqlInsertWithFecha, [row.id, row.cliente, row.items, row.total, 'rechazada', row.fecha, fechaBorrado], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run('DELETE FROM cotizaciones WHERE id = ?', [id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          // devolver el registro movido
          db.get('SELECT * FROM cotizaciones_borradas WHERE id_borrado = ?', [this.lastID], (err, moved) => {
            if (err) return res.status(500).json({ error: err.message });
            moved.items = JSON.parse(moved.items);
            res.json({ moved });
          });
        });
      });
    });
    return;
  }

  // Para otros estados solo actualizar
  db.run('UPDATE cotizaciones SET estado = ? WHERE id = ?', [estado, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM cotizaciones WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      row.items = JSON.parse(row.items);
      res.json(row);
    });
  });
});

// Listar cotizaciones borradas
app.get('/cotizaciones-borradas', (req, res) => {
  db.all('SELECT * FROM cotizaciones_borradas ORDER BY id_borrado DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const parsed = rows.map(r => ({ ...r, items: JSON.parse(r.items) }));
    res.json(parsed);
  });
});

// Endpoint de informes para cotizaciones: incluye cotizaciones activas y cotizaciones borradas en los últimos 30 días
// Parámetros: desde, hasta (filtrado por fecha original), estado, preview=true
app.get('/informes/cotizaciones', (req, res) => {
  const { desde, hasta, estado, preview } = req.query;
  // Primero obtenemos cotizaciones activas (tabla cotizaciones)
  const where = [];
  const params = [];
  if (desde) { where.push('fecha >= ?'); params.push(desde); }
  if (hasta) { where.push('fecha <= ?'); params.push(hasta); }
  if (estado) { where.push('estado = ?'); params.push(estado); }
  let sqlActive = 'SELECT id, cliente, items, total, estado, fecha, NULL as fecha_borrado, 0 as borrada FROM cotizaciones';
  if (where.length) sqlActive += ' WHERE ' + where.join(' AND ');

  db.all(sqlActive, params, (err, activeRows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Luego obtenemos cotizaciones_borradas de los últimos 30 días
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let sqlBorr = 'SELECT id_borrado, id_original, cliente, items, total, estado, fecha, fecha_borrado FROM cotizaciones_borradas WHERE fecha_borrado >= ?';
    const bparams = [thirtyDaysAgo];
    if (desde) { sqlBorr += ' AND fecha >= ?'; bparams.push(desde); }
    if (hasta) { sqlBorr += ' AND fecha <= ?'; bparams.push(hasta); }
    if (estado) { sqlBorr += ' AND estado = ?'; bparams.push(estado); }
    db.all(sqlBorr, bparams, (err, borrRows) => {
      if (err) return res.status(500).json({ error: err.message });
      // Normalizar borrRows to have same shape as activeRows
      const normalizedBorr = borrRows.map(r => ({ id: r.id_original, cliente: r.cliente, items: JSON.parse(r.items), total: r.total, estado: r.estado, fecha: r.fecha, fecha_borrado: r.fecha_borrado, borrada: 1 }));
      const normalizedActive = activeRows.map(r => ({ id: r.id, cliente: r.cliente, items: JSON.parse(r.items), total: r.total, estado: r.estado, fecha: r.fecha, fecha_borrado: null, borrada: 0 }));
      // Añadir representación legible de items: "descripcion: $precio, ..."
      const formatItems = (items) => {
        try {
          if (!items) return '';
          // items expected to be array of { descripcion, precio } or similar
          if (Array.isArray(items)) return items.map(it => `${it.descripcion}: $${it.precio}`).join(', ');
          // if items is an object/string, try to handle gracefully
          if (typeof items === 'string') {
            const parsed = JSON.parse(items);
            if (Array.isArray(parsed)) return parsed.map(it => `${it.descripcion}: $${it.precio}`).join(', ');
          }
          return '';
        } catch(e) {
          return '';
        }
      };
      // attach items_formatted
      for (const r of normalizedBorr) r.items_formatted = formatItems(r.items);
      for (const r of normalizedActive) r.items_formatted = formatItems(r.items);
      const combined = [...normalizedActive, ...normalizedBorr];
      if (preview === 'true') return res.json(combined);
      // Generar CSV
      const headers = ['id','cliente','items_formatted','total','estado','fecha','fecha_borrado','borrada'];
      const escape = (v) => {
        if (v == null) return '';
        const s = typeof v === 'string' ? v.replace(/"/g, '""') : String(v);
        return '"' + s + '"';
      };
      const lines = [headers.join(',')];
      for (const r of combined) {
        const itemsStr = (r.items_formatted || '').replace(/"/g,'""');
        const row = [r.id, r.cliente, itemsStr, r.total, r.estado, r.fecha, r.fecha_borrado || '', r.borrada].map(escape).join(',');
        lines.push(row);
      }
      const csv = lines.join('\n');
      const filename = `cotizaciones_${new Date().toISOString().slice(0,10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    });
  });
});

// Eliminar definitivamente una cotización borrada
app.delete('/cotizaciones-borradas/:id_borrado', (req, res) => {
  const id_borrado = parseInt(req.params.id_borrado);
  db.get('SELECT * FROM cotizaciones_borradas WHERE id_borrado = ?', [id_borrado], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Cotización borrada no encontrada' });
    db.run('DELETE FROM cotizaciones_borradas WHERE id_borrado = ?', [id_borrado], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ eliminado: true, ...row });
    });
  });
});


// Eliminar definitivamente un servicio borrado
app.delete("/servicios-borrados/:id_borrado", (req, res) => {
  const id_borrado = parseInt(req.params.id_borrado);
  db.get("SELECT * FROM servicios_borrados WHERE id_borrado = ?", [id_borrado], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: "Servicio borrado no encontrado" });
    }
    db.run("DELETE FROM servicios_borrados WHERE id_borrado = ?", [id_borrado], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ eliminado: true, ...row });
    });
  });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});

