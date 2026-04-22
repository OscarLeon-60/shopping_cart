const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── Middleware JWT ───────────────────────────────────────────
function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Token requerido" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token inválido o expirado" });
    }
}

// ─── Middleware ROL ───────────────────────────────────────────
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "No tienes permiso para esto" });
        }
        next();
    };
}

// ─── Rutas públicas ───────────────────────────────────────────
app.post("/auth/register", async (req, res) => {
    const response = await fetch("http://ms-auth:3003/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post("/auth/login", async (req, res) => {
    const response = await fetch("http://ms-auth:3003/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Productos (admin: todo, empleado: solo ver) ──────────────
app.get("/products", verifyToken, async (req, res) => {
    const response = await fetch("http://ms-products:3001/", {
        headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get("/products/:id", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-products:3001/${req.params.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post("/products", verifyToken, requireRole("admin"), async (req, res) => {
    const response = await fetch("http://ms-products:3001/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.put("/products/:id", verifyToken, requireRole("admin"), async (req, res) => {
    const response = await fetch(`http://ms-products:3001/${req.params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.delete("/products/:id", verifyToken, requireRole("admin"), async (req, res) => {
    const response = await fetch(`http://ms-products:3001/${req.params.id}`, {
        method: "DELETE",
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Empleados (solo admin) ───────────────────────────────────
app.get("/employees", verifyToken, requireRole("admin"), async (req, res) => {
    const response = await fetch("http://ms-auth:3003/employees");
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post("/employees", verifyToken, requireRole("admin"), async (req, res) => {
    const response = await fetch("http://ms-auth:3003/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.delete("/employees/:id", verifyToken, requireRole("admin"), async (req, res) => {
    const response = await fetch(`http://ms-auth:3003/employees/${req.params.id}`, {
        method: "DELETE",
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Clientes (admin y empleado) ─────────────────────────────
app.get("/clients", verifyToken, async (req, res) => {
    const response = await fetch("http://ms-orders:3002/clients");
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post("/clients", verifyToken, async (req, res) => {
    const response = await fetch("http://ms-orders:3002/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.put("/clients/:id", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/clients/${req.params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.delete("/clients/:id", verifyToken, requireRole("admin"), async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/clients/${req.params.id}`, {
        method: "DELETE",
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Órdenes / Ventas ─────────────────────────────────────────
app.post("/orders", verifyToken, async (req, res) => {
    const response = await fetch("http://ms-orders:3002/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req.body, user_id: req.user.id }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get("/orders/:orderId/items", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/${req.params.orderId}/items`);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post("/orders/:orderId/items", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/${req.params.orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.delete("/orders/items/:itemId", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/items/${req.params.itemId}`, {
        method: "DELETE",
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Detalle de orden ─────────────────────────────────────────
app.get("/orders/:orderId/detail", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/${req.params.orderId}/detail`);
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Reportes ─────────────────────────────────────────────────
app.get("/reports", verifyToken, async (req, res) => {
    const userId = req.user.role === "admin" ? null : req.user.id;
    const url = userId
        ? `http://ms-orders:3002/reports?user_id=${userId}`
        : "http://ms-orders:3002/reports";
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Finalizar venta (nueva transacción: crea orden con items) ─
app.post("/orders/checkout", verifyToken, async (req, res) => {
    const response = await fetch("http://ms-orders:3002/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req.body, user_id: req.user.id }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Finalizar venta (antigua: para órdenes existentes) ─────────
app.post("/orders/:orderId/checkout", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/${req.params.orderId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req.body, user_id: req.user.id }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Carritos Activos ─────────────────────────────────────────
app.get("/active-carts", verifyToken, async (req, res) => {
    const response = await fetch("http://ms-orders:3002/active-carts");
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post("/active-carts", verifyToken, async (req, res) => {
    const response = await fetch("http://ms-orders:3002/active-carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req.body, user_id: req.user.id }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get("/active-carts/:cartId/items", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/active-carts/${req.params.cartId}/items`);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post("/active-carts/:cartId/items", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/active-carts/${req.params.cartId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.delete("/active-carts/:cartId/items/:itemId", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/active-carts/${req.params.cartId}/items/${req.params.itemId}`, {
        method: "DELETE",
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.delete("/active-carts/:cartId", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/active-carts/${req.params.cartId}`, {
        method: "DELETE",
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post("/active-carts/:cartId/checkout", verifyToken, async (req, res) => {
    const response = await fetch(`http://ms-orders:3002/active-carts/${req.params.cartId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req.body, user_id: req.user.id }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
});

// ─── Health check ─────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "API Gateway activo 🔥" });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Gateway corriendo en puerto ${process.env.PORT || 3000}`);
});