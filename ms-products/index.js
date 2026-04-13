const express = require("express");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());

// Listar todos los productos
app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener un producto por ID
app.get("/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear producto
app.post("/", async (req, res) => {
    try {
        const { name, price, stock } = req.body;
        if (!name || !price || !stock) return res.status(400).json({ error: "Faltan datos" });

        const result = await pool.query(
            "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *",
            [name, price, stock]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar producto
app.put("/:id", async (req, res) => {
    try {
        const { name, price, stock } = req.body;
        const result = await pool.query(
            "UPDATE products SET name=$1, price=$2, stock=$3 WHERE id=$4 RETURNING *",
            [name, price, stock, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar producto
app.delete("/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
        res.json({ message: "Producto eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Productos corriendo en puerto ${process.env.PORT}`);
});