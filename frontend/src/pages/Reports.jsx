import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Reports({ onClose }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get("/reports");
            setReports(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const total = reports.reduce((acc, r) => acc + parseFloat(r.total || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-black bg-opacity-40 absolute inset-0" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl z-10 p-6">

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        📊 {role === "admin" ? "Reporte General de Ventas" : "Mi Reporte de Ventas"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                {loading ? (
                    <p className="text-center text-gray-400 py-8">Cargando...</p>
                ) : reports.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No hay ventas registradas</p>
                ) : (
                    <>
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="bg-indigo-50 text-indigo-700">
                                    <th className="px-4 py-3 text-left rounded-l-lg">Factura</th>
                                    <th className="px-4 py-3 text-left">Cliente</th>
                                    {role === "admin" && <th className="px-4 py-3 text-left">Empleado</th>}
                                    <th className="px-4 py-3 text-left">Fecha</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reports.map((r) => (
                                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-indigo-600">{r.invoice_number}</td>
                                        <td className="px-4 py-3 text-gray-700">{r.client_name || "—"}</td>
                                        {role === "admin" && (
                                            <td className="px-4 py-3 text-gray-700">{r.employee_name || "—"}</td>
                                        )}
                                        <td className="px-4 py-3 text-gray-400">
                                            {new Date(r.created_at).toLocaleDateString("es-CO")}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                                            {parseFloat(r.total || 0).toLocaleString("es-CO", {
                                                style: "currency",
                                                currency: "COP",
                                                minimumFractionDigits: 0,
                                            })}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end mt-4 pt-4 border-t">
                            <div className="text-right">
                                <p className="text-sm text-gray-400">Total acumulado</p>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {total.toLocaleString("es-CO", {
                                        style: "currency",
                                        currency: "COP",
                                        minimumFractionDigits: 0,
                                    })}
                                </p>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}