const express = require("express");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());

// Crear tablas de carritos activos si no existen
async function initActiveCarts() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS active_carts (
            id SERIAL PRIMARY KEY,
            client_id INT REFERENCES clients(id),
            user_id INT REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS active_cart_items (
            id SERIAL PRIMARY KEY,
            cart_id INT REFERENCES active_carts(id) ON DELETE CASCADE,
            product_id INT REFERENCES products(id),
            quantity INT NOT NULL,
            price NUMERIC(10,2)
        )
    `);
}
initActiveCarts().catch(console.error);

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

// ─── Checkout (crear orden con items en una transacción) ──────
app.post("/checkout", async (req, res) => {
    try {
        const { user_id, client_id, items } = req.body;

        if (!client_id || !items || items.length === 0) {
            return res.status(400).json({ error: "Cliente e items son requeridos" });
        }

        // Iniciar transacción
        await pool.query("BEGIN");

        try {
            // 1. Crear la orden
            const orderRes = await pool.query(
                "INSERT INTO orders (user_id, client_id, invoice_number) VALUES ($1, $2, $3) RETURNING *",
                [user_id || null, client_id, null]
            );
            const orderId = orderRes.rows[0].id;

            // 2. Obtener precios de productos y agregar items al carrito
            let totalAmount = 0;
            const cartItemsData = [];

            for (const item of items) {
                const { product_id, quantity } = item;
                if (!product_id || !quantity) {
                    throw new Error("Cada item debe tener product_id y quantity");
                }

                // Obtener precio del producto
                const productRes = await pool.query(
                    "SELECT price FROM products WHERE id = $1",
                    [product_id]
                );

                if (productRes.rows.length === 0) {
                    throw new Error(`Producto ${product_id} no encontrado`);
                }

                const price_at_sale = productRes.rows[0].price;
                const subtotal = price_at_sale * quantity;
                totalAmount += subtotal;

                // Insertar item en carrito
                const cartItemRes = await pool.query(
                    "INSERT INTO cart_items (order_id, product_id, quantity, price_at_sale) VALUES ($1, $2, $3, $4) RETURNING *",
                    [orderId, product_id, quantity, price_at_sale]
                );
                cartItemsData.push(cartItemRes.rows[0]);
            }

            // 3. Generar número de factura
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const countRes = await pool.query(
                `SELECT COUNT(*) as count FROM orders 
                 WHERE DATE(created_at) = CURRENT_DATE AND invoice_number IS NOT NULL`
            );
            const sequentialNumber = parseInt(countRes.rows[0].count) + 1;
            const invoice = `FAC-${today}${sequentialNumber}`;

            // 4. Actualizar orden con invoice_number
            await pool.query(
                "UPDATE orders SET invoice_number=$1 WHERE id=$2",
                [invoice, orderId]
            );

            // 5. Descontar stock
            for (const item of items) {
                await pool.query(
                    "UPDATE products SET stock = stock - $1 WHERE id = $2",
                    [item.quantity, item.product_id]
                );
            }

            // 6. Obtener datos para el recibo
            const updatedOrderRes = await pool.query(
                "SELECT * FROM orders WHERE id = $1",
                [orderId]
            );
            const updatedOrder = updatedOrderRes.rows[0];

            const clientRes = await pool.query(
                "SELECT * FROM clients WHERE id = $1",
                [client_id]
            );
            const client = clientRes.rows[0];

            const userRes = await pool.query(
                "SELECT id, name, email FROM users WHERE id = $1",
                [user_id]
            );
            const employee = userRes.rows[0];

            // 7. Obtener items con información completa para el recibo
            const recibItems = await pool.query(
                `SELECT ci.id, ci.quantity, ci.price_at_sale AS price, p.name,
                 (ci.quantity * ci.price_at_sale) AS subtotal
                 FROM cart_items ci
                 JOIN products p ON ci.product_id = p.id
                 WHERE ci.order_id = $1`,
                [orderId]
            );

            // Confirmar transacción
            await pool.query("COMMIT");

            res.status(201).json({
                order: updatedOrder,
                items: recibItems.rows,
                client,
                employee,
                total: totalAmount,
            });
        } catch (err) {
            // Revertir transacción en caso de error
            await pool.query("ROLLBACK");
            throw err;
        }
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
        
        // Verificar si la orden quedó vacía
        const remainingItems = await pool.query(
            "SELECT COUNT(*) as count FROM cart_items WHERE order_id = (SELECT order_id FROM cart_items WHERE id = $1 LIMIT 1)",
            [req.params.itemId]
        );
        
        // Si no quedan items, borrar la orden
        if (parseInt(remainingItems.rows[0].count) === 0) {
            await pool.query(
                "DELETE FROM orders WHERE id = (SELECT order_id FROM cart_items WHERE id = $1 LIMIT 1)",
                [req.params.itemId]
            );
        }
        
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

        // Obtener orden actual
        const orderRes = await pool.query(
            "SELECT * FROM orders WHERE id = $1", [orderId]
        );
        const order = orderRes.rows[0];

        // Si ya tiene invoice_number, usar el existente
        let invoice = order.invoice_number;
        if (!invoice) {
            // Generar número de factura con formato FAC-YYYYMMDD1
            const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
            
            // Contar órdenes finalizadas de hoy
            const countRes = await pool.query(
                `SELECT COUNT(*) as count FROM orders 
                 WHERE DATE(created_at) = CURRENT_DATE AND invoice_number IS NOT NULL`,
                []
            );
            
            const sequentialNumber = parseInt(countRes.rows[0].count) + 1;
            invoice = `FAC-${today}${sequentialNumber}`;
        }

        // Actualizar orden con cliente, empleado e invoice_number
        await pool.query(
            "UPDATE orders SET client_id=$1, user_id=$2, invoice_number=$3 WHERE id=$4",
            [client_id, user_id, invoice, orderId]
        );

        // Obtener orden actualizada
        const updatedOrderRes = await pool.query(
            "SELECT * FROM orders WHERE id = $1", [orderId]
        );
        const updatedOrder = updatedOrderRes.rows[0];

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

        res.json({ order: updatedOrder, items, client, employee, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Detalle de orden ─────────────────────────────────────────
app.get("/:orderId/detail", async (req, res) => {
    try {
        const { orderId } = req.params;

        const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
        if (orderRes.rows.length === 0) return res.status(404).json({ error: "Orden no encontrada" });
        const order = orderRes.rows[0];

        const itemsRes = await pool.query(`
            SELECT ci.id, ci.quantity, ci.price_at_sale AS price, p.name,
                   (ci.quantity * ci.price_at_sale) AS subtotal
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.order_id = $1
        `, [orderId]);

        const clientRes = order.client_id
            ? await pool.query("SELECT * FROM clients WHERE id = $1", [order.client_id])
            : { rows: [] };

        const userRes = order.user_id
            ? await pool.query("SELECT id, name, email FROM users WHERE id = $1", [order.user_id])
            : { rows: [] };

        const total = itemsRes.rows.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);

        res.json({
            order,
            items: itemsRes.rows,
            client: clientRes.rows[0] || null,
            employee: userRes.rows[0] || null,
            total,
        });
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

// ─── Carritos Activos ─────────────────────────────────────────

app.get("/active-carts", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ac.id, ac.client_id, ac.user_id, ac.created_at,
                   c.name AS client_name, c.cedula AS client_cedula,
                   COUNT(aci.id) AS item_count,
                   COALESCE(SUM(aci.quantity * aci.price), 0) AS total
            FROM active_carts ac
            LEFT JOIN clients c ON ac.client_id = c.id
            LEFT JOIN active_cart_items aci ON aci.cart_id = ac.id
            GROUP BY ac.id, c.name, c.cedula
            ORDER BY ac.created_at ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/active-carts", async (req, res) => {
    try {
        const { client_id, user_id } = req.body;
        if (!client_id) return res.status(400).json({ error: "client_id requerido" });

        const existing = await pool.query(
            "SELECT id FROM active_carts WHERE client_id = $1",
            [client_id]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({
                error: "Este cliente ya tiene un carrito activo",
                cart_id: existing.rows[0].id
            });
        }

        const result = await pool.query(
            "INSERT INTO active_carts (client_id, user_id) VALUES ($1, $2) RETURNING *",
            [client_id, user_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/active-carts/:cartId/items", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT aci.id, aci.quantity, aci.price, p.name, p.id AS product_id,
                   (aci.quantity * aci.price) AS subtotal
            FROM active_cart_items aci
            JOIN products p ON aci.product_id = p.id
            WHERE aci.cart_id = $1
        `, [req.params.cartId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/active-carts/:cartId/items", async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id || !quantity) return res.status(400).json({ error: "Faltan datos" });

        const productRes = await pool.query(
            "SELECT price FROM products WHERE id = $1", [product_id]
        );
        if (productRes.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

        const price = productRes.rows[0].price;

        const existing = await pool.query(
            "SELECT id FROM active_cart_items WHERE cart_id = $1 AND product_id = $2",
            [req.params.cartId, product_id]
        );

        let result;
        if (existing.rows.length > 0) {
            result = await pool.query(
                "UPDATE active_cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *",
                [quantity, existing.rows[0].id]
            );
        } else {
            result = await pool.query(
                "INSERT INTO active_cart_items (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *",
                [req.params.cartId, product_id, quantity, price]
            );
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/active-carts/:cartId/items/:itemId", async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM active_cart_items WHERE id = $1 AND cart_id = $2",
            [req.params.itemId, req.params.cartId]
        );
        res.json({ message: "Item eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/active-carts/:cartId", async (req, res) => {
    try {
        await pool.query("DELETE FROM active_carts WHERE id = $1", [req.params.cartId]);
        res.json({ message: "Carrito eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/active-carts/:cartId/checkout", async (req, res) => {
    try {
        const { cartId } = req.params;
        const { user_id } = req.body;

        const cartRes = await pool.query("SELECT * FROM active_carts WHERE id = $1", [cartId]);
        if (cartRes.rows.length === 0) return res.status(404).json({ error: "Carrito no encontrado" });
        const cart = cartRes.rows[0];

        const itemsRes = await pool.query(`
            SELECT aci.id, aci.product_id, aci.quantity, aci.price,
                   p.name, (aci.quantity * aci.price) AS subtotal
            FROM active_cart_items aci
            JOIN products p ON aci.product_id = p.id
            WHERE aci.cart_id = $1
        `, [cartId]);
        const items = itemsRes.rows;

        if (items.length === 0) return res.status(400).json({ error: "El carrito está vacío" });

        await pool.query("BEGIN");
        try {
            const finalUserId = user_id || cart.user_id;
            const orderRes = await pool.query(
                "INSERT INTO orders (user_id, client_id, invoice_number) VALUES ($1, $2, NULL) RETURNING *",
                [finalUserId, cart.client_id]
            );
            const orderId = orderRes.rows[0].id;

            let totalAmount = 0;
            for (const item of items) {
                await pool.query(
                    "INSERT INTO cart_items (order_id, product_id, quantity, price_at_sale) VALUES ($1, $2, $3, $4)",
                    [orderId, item.product_id, item.quantity, item.price]
                );
                totalAmount += parseFloat(item.subtotal);
            }

            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const countRes = await pool.query(
                "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE AND invoice_number IS NOT NULL"
            );
            const sequentialNumber = parseInt(countRes.rows[0].count) + 1;
            const invoice = `FAC-${today}${sequentialNumber}`;

            await pool.query("UPDATE orders SET invoice_number=$1 WHERE id=$2", [invoice, orderId]);

            for (const item of items) {
                await pool.query(
                    "UPDATE products SET stock = stock - $1 WHERE id = $2",
                    [item.quantity, item.product_id]
                );
            }

            await pool.query("DELETE FROM active_carts WHERE id = $1", [cartId]);

            const updatedOrderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
            const clientRes = await pool.query("SELECT * FROM clients WHERE id = $1", [cart.client_id]);
            const userRes = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [finalUserId]);
            const receiptItemsRes = await pool.query(`
                SELECT ci.id, ci.quantity, ci.price_at_sale AS price, p.name,
                       (ci.quantity * ci.price_at_sale) AS subtotal
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.order_id = $1
            `, [orderId]);

            await pool.query("COMMIT");

            res.status(201).json({
                order: updatedOrderRes.rows[0],
                items: receiptItemsRes.rows,
                client: clientRes.rows[0],
                employee: userRes.rows[0],
                total: totalAmount,
            });
        } catch (err) {
            await pool.query("ROLLBACK");
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Pedidos corriendo en puerto ${process.env.PORT}`);
});