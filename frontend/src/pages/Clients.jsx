import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Clients({ onClose }) {
    const [clients, setClients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [form, setForm] = useState({ name: "", cedula: "", phone: "", email: "" });
    const [error, setError] = useState("");
    const { role } = useAuth();

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

    const openCreate = () => {
        setEditingClient(null);
        setForm({ name: "", cedula: "", phone: "", email: "" });
        setShowForm(true);
    };

    const openEdit = (client) => {
        setEditingClient(client);
        setForm({ name: client.name, cedula: client.cedula, phone: client.phone, email: client.email });
        setShowForm(true);
    };

    const handleSave = async () => {
        try {
            setError("");
            if (!form.name || !form.cedula) return setError("Nombre y cédula son requeridos");

            if (editingClient) {
                await api.put(`/clients/${editingClient.id}`, form);
            } else {
                await api.post("/clients", form);
            }
            setShowForm(false);
            fetchClients();
        } catch (err) {
            setError(err.response?.data?.error || "Error al guardar cliente");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este cliente?")) return;
        await api.delete(`/clients/${id}`);
        fetchClients();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-black bg-opacity-40 absolute inset-0" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl z-10 p-6">

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">👤 Gestión de Clientes</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                <button
                    onClick={openCreate}
                    className="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                    + Nuevo Cliente
                </button>

                {showForm && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <input
                            type="text"
                            placeholder="Cédula"
                            value={form.cedula}
                            onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <input
                            type="text"
                            placeholder="Teléfono"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <input
                            type="email"
                            placeholder="Correo"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition"
                            >
                                {editingClient ? "Guardar cambios" : "Crear"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {clients.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No hay clientes registrados</p>
                    ) : (
                        clients.map((client) => (
                            <div key={client.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                <div>
                                    <p className="font-medium text-gray-800">{client.name}</p>
                                    <p className="text-sm text-gray-400">CC: {client.cedula} · {client.phone}</p>
                                    <p className="text-sm text-gray-400">{client.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEdit(client)}
                                        className="text-indigo-400 hover:text-indigo-600 transition"
                                    >
                                        ✏️
                                    </button>
                                    {role === "admin" && (
                                        <button
                                            onClick={() => handleDelete(client.id)}
                                            className="text-red-400 hover:text-red-600 transition"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}