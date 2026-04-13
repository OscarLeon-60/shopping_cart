import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Cart from "../components/Cart";
import Sidebar from "../components/Sidebar";
import Employees from "./Employees";
import Clients from "./Clients";
import Reports from "./Reports";
import { useAuth } from "../context/AuthContext";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [orderId, setOrderId] = useState(null);
    const [showCart, setShowCart] = useState(false);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth();

    // Modales
    const [showModal, setShowModal] = useState(false);
    const [showEmployees, setShowEmployees] = useState(false);
    const [showClients, setShowClients] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState({ name: "", price: "", stock: "" });

    useEffect(() => {
        fetchProducts();
        createOrder();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get("/products");
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createOrder = async () => {
        try {
            const res = await api.post("/orders");
            setOrderId(res.data.id);
        } catch (err) {
            console.error(err);
        }
    };

    const addToCart = async (product, quantity) => {
        try {
            await api.post(`/orders/${orderId}/items`, {
                product_id: product.id,
                quantity,
            });
            const res = await api.get(`/orders/${orderId}/items`);
            setCartItems(res.data);
            setShowCart(true);
        } catch (err) {
            console.error(err);
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            await api.delete(`/orders/items/${itemId}`);
            const res = await api.get(`/orders/${orderId}/items`);
            setCartItems(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const openCreate = () => {
        setEditingProduct(null);
        setForm({ name: "", price: "", stock: "" });
        setShowModal(true);
    };

    const openEdit = (product) => {
        setEditingProduct(product);
        setForm({ name: product.name, price: product.price, stock: product.stock });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este producto?")) return;
        await api.delete(`/products/${id}`);
        fetchProducts();
    };

    const handleSave = async () => {
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, form);
            } else {
                await api.post("/products", form);
            }
            setShowModal(false);
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSidebarAction = (action) => {
        if (action === "new_product") openCreate();
        if (action === "employees") setShowEmployees(true);
        if (action === "clients") setShowClients(true);
        if (action === "reports") setShowReports(true);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar
                cartCount={cartItems.length}
                onCartClick={() => setShowCart(!showCart)}
            />

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Nuestros Productos</h2>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400">Cargando productos...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">No hay productos disponibles.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={addToCart}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                isAdmin={role === "admin"}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal crear/editar producto */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="bg-black bg-opacity-40 absolute inset-0" onClick={() => setShowModal(false)} />
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-10">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            {editingProduct ? "Editar producto" : "Nuevo producto"}
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <input
                                type="number"
                                placeholder="Precio"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <input
                                type="number"
                                placeholder="Stock"
                                value={form.stock}
                                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold transition"
                            >
                                {editingProduct ? "Guardar cambios" : "Crear"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCart && (
                <Cart
                    items={cartItems}
                    onClose={() => setShowCart(false)}
                    onRemove={removeFromCart}
                    orderId={orderId}
                    onCheckout={() => {
                        setCartItems([]);
                        setShowCart(false);
                        createOrder();
                    }}
                />
            )}

            {showEmployees && <Employees onClose={() => setShowEmployees(false)} />}
            {showClients && <Clients onClose={() => setShowClients(false)} />}
            {showReports && <Reports onClose={() => setShowReports(false)} />}

            <Sidebar onAction={handleSidebarAction} />
        </div>
    );
}

function ProductCard({ product, onAddToCart, onEdit, onDelete, isAdmin }) {
    const [quantity, setQuantity] = useState(1);

    return (
        <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-5 flex flex-col">
            <div className="text-6xl text-center mb-4">🏷️</div>
            <h3 className="font-semibold text-gray-800 text-lg">{product.name}</h3>
            <p className="text-indigo-600 font-bold text-xl mt-1">
                {parseFloat(product.price).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                })}
            </p>
            <p className="text-gray-400 text-sm mt-1">Stock: {product.stock}</p>

            <div className="flex items-center gap-2 mt-3">
                <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 transition"
                >
                    −
                </button>
                <span className="font-semibold text-gray-800 w-6 text-center">{quantity}</span>
                <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 transition"
                >
                    +
                </button>
            </div>

            <button
                onClick={() => onAddToCart(product, quantity)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg mt-3 transition font-medium"
            >
                Agregar al carrito
            </button>

            {isAdmin && (
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => onEdit(product)}
                        className="flex-1 text-sm border border-indigo-300 text-indigo-600 py-1.5 rounded-lg hover:bg-indigo-50 transition"
                    >
                        ✏️ Editar
                    </button>
                    <button
                        onClick={() => onDelete(product.id)}
                        className="flex-1 text-sm border border-red-300 text-red-500 py-1.5 rounded-lg hover:bg-red-50 transition"
                    >
                        🗑️ Eliminar
                    </button>
                </div>
            )}
        </div>
    );
}