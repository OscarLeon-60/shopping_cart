import { useState, useEffect } from "react";
import api from "../api/axios";

export default function ClientSelector({ onSelect, onClose }) {
    const [search, setSearch] = useState("");
    const [clients, setClients] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: "", cedula: "", phone: "", email: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get("/clients").then(res => setClients(res.data)).catch(console.error);
    }, []);

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.cedula.includes(search)
    );

    const handleCreate = async () => {
        if (!form.name || !form.cedula) return alert("Nombre y cédula son requeridos");
        setLoading(true);
        try {
            const res = await api.post("/clients", form);
            onSelect(res.data.id);
        } catch (err) {
            alert(err.response?.data?.error || "Error creando cliente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-black bg-opacity-40 absolute inset-0" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                        {showCreate ? "Nuevo cliente" : "Seleccionar cliente"}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                {!showCreate ? (
                    <>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o cédula..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
                            autoFocus
                        />
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
                            {filtered.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">Sin resultados</p>
                            ) : (
                                filtered.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => onSelect(c.id)}
                                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition"
                                    >
                                        <p className="font-medium text-gray-800">{c.name}</p>
                                        <p className="text-sm text-gray-400">
                                            CC {c.cedula}{c.phone ? ` · ${c.phone}` : ""}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 py-2.5 rounded-lg hover:bg-indigo-50 transition font-medium"
                        >
                            + Crear nuevo cliente
                        </button>
                    </>
                ) : (
                    <>
                        <div className="space-y-3 mb-4">
                            <input type="text" placeholder="Nombre *" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            <input type="text" placeholder="Cédula *" value={form.cedula}
                                onChange={e => setForm({ ...form, cedula: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            <input type="text" placeholder="Teléfono" value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            <input type="email" placeholder="Email" value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 transition"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition"
                            >
                                {loading ? "Creando..." : "Crear y seleccionar"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
