import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar({ cartCount, onCartClick }) {
    const { logout, userName, role } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
                <span className="text-2xl">🛍️</span>
                <span className="text-xl font-bold">ShopCart</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-sm text-indigo-200">
                    👤 {userName} —{" "}
                    <span className={`font-semibold ${role === "admin" ? "text-yellow-300" : "text-white"}`}>
            {role === "admin" ? "Administrador" : "Empleado"}
          </span>
                </div>

                <button
                    onClick={onCartClick}
                    className="relative bg-white text-indigo-700 font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
                >
                    🛒 Carrito
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
                    )}
                </button>

                <button
                    onClick={handleLogout}
                    className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg transition"
                >
                    Cerrar sesión
                </button>
            </div>
        </nav>
    );
}