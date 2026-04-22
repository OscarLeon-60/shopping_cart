import { useState, useEffect } from "react";
import api from "../api/axios";
import Receipt from "./Receipt";

export default function Cart({ cartId, cartInfo, onClose, onCheckout, onItemsChange }) {
    const [items, setItems] = useState([]);
    const [receiptData, setReceiptData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (cartId) fetchItems();
    }, [cartId]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/active-carts/${cartId}/items`);
            setItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (itemId) => {
        try {
            await api.delete(`/active-carts/${cartId}/items/${itemId}`);
            fetchItems();
            onItemsChange?.();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCheckout = async () => {
        if (items.length === 0) return alert("El carrito está vacío");
        try {
            const res = await api.post(`/active-carts/${cartId}/checkout`, {});
            setReceiptData(res.data);
        } catch (err) {
            alert(err.response?.data?.error || "Error al finalizar compra");
        }
    };

    const handleReceiptClose = () => {
        setReceiptData(null);
        onCheckout();
        onClose();
    };

    const total = items.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);

    return (
        <>
            <div className="fixed inset-0 z-50 flex justify-end">
                <div className="bg-black bg-opacity-30 flex-1" onClick={onClose} />

                <div className="bg-white w-full max-w-sm shadow-2xl flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Carrito</h2>
                            {cartInfo && (
                                <p className="text-sm text-indigo-600 font-medium">
                                    {cartInfo.client_name} · CC {cartInfo.client_cedula}
                                </p>
                            )}
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {loading ? (
                            <div className="text-center text-gray-400 py-10">Cargando...</div>
                        ) : items.length === 0 ? (
                            <div className="text-center text-gray-400 py-10">El carrito está vacío</div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.name}</p>
                                        <p className="text-sm text-gray-400">
                                            x{item.quantity} ·{" "}
                                            {parseFloat(item.price).toLocaleString("es-CO", {
                                                style: "currency",
                                                currency: "COP",
                                                minimumFractionDigits: 0,
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-indigo-600">
                                            {parseFloat(item.subtotal).toLocaleString("es-CO", {
                                                style: "currency",
                                                currency: "COP",
                                                minimumFractionDigits: 0,
                                            })}
                                        </span>
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="text-red-400 hover:text-red-600 transition text-lg"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="px-6 py-4 border-t space-y-3">
                        <div className="flex justify-between text-lg font-bold text-gray-800">
                            <span>Total</span>
                            <span className="text-indigo-600">
                                {total.toLocaleString("es-CO", {
                                    style: "currency",
                                    currency: "COP",
                                    minimumFractionDigits: 0,
                                })}
                            </span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={items.length === 0}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
                        >
                            Finalizar compra
                        </button>
                    </div>
                </div>
            </div>

            {receiptData && <Receipt data={receiptData} onClose={handleReceiptClose} />}
        </>
    );
}
