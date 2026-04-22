const express = require("express");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());

// ─── Clientes ─────────────────────────────────────────────────
app.get("/clients", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM clients ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/clients", async (req, res) => {
    try {
        const { name, cedula, phone, email } = req.body;
        if (!name || !cedula) return res.status(400).json({ error: "Nombre y cédula son requeridos" });

        const result = await pool.query(
            "INSERT INTO clients (name, cedula, phone, email) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, cedula, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/clients/:id", async (req, res) => {
    try {
        const { name, cedula, phone, email } = req.body;
        const result = await pool.query(
            "UPDATE clients SET name=$1, cedula=$2, phone=$3, email=$4 WHERE id=$5 RETURNING *",
            [name, cedula, phone, email, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Cliente no encontrado" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/clients/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM clients WHERE id = $1", [req.params.id]);
        res.json({ message: "Cliente eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Órdenes ──────────────────────────────────────────────────
app.post("/", async (req, res) => {
    try {
        const { user_id, client_id } = req.body;

        // Crear orden SIN invoice_number (se asigna al checkout)
        const result = await pool.query(
            "INSERT INTO orders (user_id, client_id, invoice_number) VALUES ($1, $2, $3) RETURNING *",
            [user_id || null, client_id || null, null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM orders ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Items del carrito ────────────────────────────────────────
app.post("/:orderId/items", async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id || !quantity) return res.status(400).json({ error: "Faltan datos" });

        // Obtener precio actual del producto
        const productRes = await pool.query(
            "SELECT price FROM products WHERE id = $1", [product_id]
        );
        if (productRes.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

        const price_at_sale = productRes.rows[0].price;

        const result = await pool.query(
            "INSERT INTO cart_items (order_id, product_id, quantity, price_at_sale) VALUES ($1, $2, $3, $4) RETURNING *",
            [req.params.orderId, product_id, quantity, price_at_sale]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/:orderId/items", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ci.id, ci.quantity, ci.price_at_sale AS price,
              p.name, p.price AS current_price,
              (ci.quantity * ci.price_at_sale) AS subtotal
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.order_id = $1`,
            [req.params.orderId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/items/:itemId", async (req, res) => {
    try {
        await pool.query("DELETE FROM cart_items WHERE id = $1", [req.params.itemId]);
        res.json({ message: "Item eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Checkout (finalizar venta) ───────────────────────────────
app.post("/:orderId/checkout", async (req, res) => {
    try {
        const { orderId } = req.params;
        const { client_id, user_id } = req.body;

        // Obtener items primero para validar que no esté vacío
        const itemsRes = await pool.query(
            `SELECT ci.id, ci.quantity, ci.price_at_sale AS price,
              p.name,
              (ci.quantity * ci.price_at_sale) AS subtotal
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.order_id = $1`,
            [orderId]
        );
        const items = itemsRes.rows;

        if (items.length === 0) {
            return res.status(400).json({ error: "El carrito está vacío" });
        }

        // Generar número de factura con formato FAC-YYYYMMDD1
        const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
        
        // Contar órdenes finalizadas de hoy
        const countRes = await pool.query(
            `SELECT COUNT(*) as count FROM orders 
             WHERE DATE(created_at) = CURRENT_DATE AND invoice_number IS NOT NULL`,
            []
        );
        
        const sequentialNumber = parseInt(countRes.rows[0].count) + 1;
        const invoice = `FAC-${today}${sequentialNumber}`;

        // Actualizar orden con cliente, empleado e invoice_number
        await pool.query(
            "UPDATE orders SET client_id=$1, user_id=$2, invoice_number=$3 WHERE id=$4",
            [client_id, user_id, invoice, orderId]
        );

        // Obtener orden actualizada
        const orderRes = await pool.query(
            "SELECT * FROM orders WHERE id = $1", [orderId]
        );
        const order = orderRes.rows[0];

        // Obtener cliente
        const clientRes = await pool.query(
            "SELECT * FROM clients WHERE id = $1", [client_id]
        );
        const client = clientRes.rows[0];

        // Obtener empleado
        const userRes = await pool.query(
            "SELECT id, name, email FROM users WHERE id = $1", [user_id]
        );
        const employee = userRes.rows[0];

        // Total
        const total = items.reduce((acc, i) => acc + parseFloat(i.subtotal), 0);

        // Descontar stock
        for (const item of items) {
            await pool.query(
                "UPDATE products SET stock = stock - $1 WHERE id = (SELECT product_id FROM cart_items WHERE id = $2)",
                [item.quantity, item.id]
            );
        }

        res.json({ order, items, client, employee, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Reportes ─────────────────────────────────────────────────
app.get("/reports", async (req, res) => {
    try {
        const { user_id } = req.query;

        let query = `
      SELECT o.id, o.invoice_number, o.created_at,
             c.name AS client_name,
             u.name AS employee_name,
             COALESCE(SUM(ci.quantity * ci.price_at_sale), 0) AS total
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN cart_items ci ON ci.order_id = o.id
      WHERE o.invoice_number IS NOT NULL
    `;

        const params = [];
        if (user_id) {
            query += " AND o.user_id = $1";
            params.push(user_id);
        }

        query += " GROUP BY o.id, o.invoice_number, o.created_at, c.name, u.name ORDER BY o.created_at DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Pedidos corriendo en puerto ${process.env.PORT}`);
});