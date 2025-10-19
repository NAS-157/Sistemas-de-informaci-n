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
app.get("/servicios/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.get("SELECT * FROM servicios WHERE id = ?", [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    res.json(row);
  });
});

// Eliminar un servicio (mover a servicios_borrados y luego borrar)
app.delete("/servicios/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const motivo = req.query.motivo; // expected: 'cancelado' or 'terminado'
  db.get("SELECT * FROM servicios WHERE id = ?", [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    // Insertar en servicios_borrados. Si se envía motivo, lo usamos como estado final (p.ej. 'cancelado' o 'terminado')
    const estadoFinal = motivo || row.estado;
    const sqlInsert = `INSERT INTO servicios_borrados (id_original, tipo, descripcion, estado, fechaIngreso, fechaEntrega) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sqlInsert, [row.id, row.tipo, row.descripcion, estadoFinal, row.fechaIngreso, row.fechaEntrega], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Borrar de servicios
      db.run("DELETE FROM servicios WHERE id = ?", [id], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ ...row, id_borrado: this.lastID, motivo: estadoFinal });
      });
    });
  });
});

// Obtener todos los servicios borrados
app.get("/servicios-borrados", (req, res) => {
  db.all("SELECT * FROM servicios_borrados", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
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
      db.run(sqlInsert, [row.id, row.cliente, row.items, row.total, 'rechazada', row.fecha], function(err) {
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

// Eliminar una cotización (solo si está aceptada)
app.delete('/cotizaciones/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM cotizaciones WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Cotización no encontrada' });
    if (row.estado !== 'aceptada') return res.status(400).json({ error: 'Solo se pueden eliminar cotizaciones aceptadas' });
    db.run('DELETE FROM cotizaciones WHERE id = ?', [id], function(err) {
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

