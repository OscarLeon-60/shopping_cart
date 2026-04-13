const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());

// ─── Registro público ─────────────────────────────────────────
app.post("/register", async (req, res) => {
    try {
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            "INSERT INTO users (email, password, role, name) VALUES ($1, $2, 'empleado', $3) RETURNING id, email, role, name",
            [email, hashedPassword, name || ""]
        );

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Login ────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
    try {
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        const { email, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Usuario no existe" });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({ token, role: user.role, name: user.name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Listar empleados (solo admin) ───────────────────────────
app.get("/employees", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, email, name, role FROM users WHERE role = 'empleado' ORDER BY id ASC"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Crear empleado (solo admin) ─────────────────────────────
app.post("/employees", async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            "INSERT INTO users (email, password, role, name) VALUES ($1, $2, 'empleado', $3) RETURNING id, email, role, name",
            [email, hashedPassword, name]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Eliminar empleado (solo admin) ──────────────────────────
app.delete("/employees/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = $1 AND role = 'empleado'", [req.params.id]);
        res.json({ message: "Empleado eliminado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Auth corriendo en puerto ${process.env.PORT}`);
});