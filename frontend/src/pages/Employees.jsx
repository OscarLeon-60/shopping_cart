import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Employees({ onClose }) {
    const [employees, setEmployees] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get("/employees");
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        try {
            setError("");
            if (!form.name || !form.email || !form.password) {
                return setError("Todos los campos son requeridos");
            }
            await api.post("/employees", form);
            setForm({ name: "", email: "", password: "" });
            setShowForm(false);
            fetchEmployees();
        } catch (err) {
            setError(err.response?.data?.error || "Error al crear empleado");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este empleado?")) return;
        await api.delete(`/employees/${id}`);
        fetchEmployees();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-black bg-opacity-40 absolute inset-0" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl z-10 p-6">

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">👥 Gestión de Empleados</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                    + Nuevo Empleado
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
                            type="email"
                            placeholder="Correo"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                                Crear
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {employees.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No hay empleados registrados</p>
                    ) : (
                        employees.map((emp) => (
                            <div key={emp.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                <div>
                                    <p className="font-medium text-gray-800">{emp.name}</p>
                                    <p className="text-sm text-gray-400">{emp.email}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(emp.id)}
                                    className="text-red-400 hover:text-red-600 transition"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}