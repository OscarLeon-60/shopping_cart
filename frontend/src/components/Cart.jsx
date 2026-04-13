import { useState, useEffect } from "react";
import api from "../api/axios";
import Receipt from "./Receipt";

export default function Cart({ items, onClose, onRemove, orderId, onCheckout }) {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState("");
    const [receiptData, setReceiptData] = useState(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await api.get("/clients");
            setClients(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCheckout = async () => {
        try {
            if (!selectedClient) return alert("Selecciona un cliente para continuar");

            const res = await api.post(`/orders/${orderId}/checkout`, {
                client_id: selectedClient,
            });

            setReceiptData(res.data);
        } catch (err) {
            console.error(err);
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
                        <h2 className="text-xl font-bold text-gray-800">🛒 Tu Carrito</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {items.length === 0 ? (
                            <div className="text-center text-gray-400 py-10">Tu carrito está vacío</div>
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
                                            onClick={() => onRemove(item.id)}
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

                        {/* Selector de cliente */}
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                        >
                            <option value="">— Seleccionar cliente —</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} · CC {c.cedula}
                                </option>
                            ))}
                        </select>

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

            {receiptData && (
                <Receipt data={receiptData} onClose={handleReceiptClose} />
            )}
        </>
    );
}