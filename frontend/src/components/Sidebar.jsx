import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ onAction }) {
    const [open, setOpen] = useState(false);
    const { role } = useAuth();

    const adminItems = [
        { icon: "🏷️", label: "Nuevo Producto", action: "new_product" },
        { icon: "👥", label: "Empleados", action: "employees" },
        { icon: "👤", label: "Clientes", action: "clients" },
        { icon: "📊", label: "Reportes", action: "reports" },
    ];

    const employeeItems = [
        { icon: "👤", label: "Clientes", action: "clients" },
        { icon: "📊", label: "Mi Reporte", action: "reports" },
    ];

    const items = role === "admin" ? adminItems : employeeItems;

    return (
        <div
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <div className={`bg-indigo-700 text-white rounded-l-2xl shadow-xl py-4 flex flex-col gap-2 transition-all duration-300 ${open ? "w-48" : "w-14"}`}>
                {items.map((item) => (
                    <button
                        key={item.action}
                        onClick={() => onAction(item.action)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-600 transition rounded-lg mx-1 whitespace-nowrap overflow-hidden"
                    >
                        <span className="text-xl flex-shrink-0">{item.icon}</span>
                        {open && <span className="text-sm font-medium">{item.label}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}