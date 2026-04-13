import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/auth/register", { email, password });
            setSuccess("¡Cuenta creada! Redirigiendo...");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            setError(err.response?.data?.error || "Error al registrarse");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🛍️</div>
                    <h1 className="text-3xl font-bold text-indigo-700">ShopCart</h1>
                    <p className="text-gray-400 mt-1">Crea tu cuenta gratis</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
                )}
                {success && (
                    <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition"
                    >
                        Crear cuenta
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                        Inicia sesión
                    </Link>
                </p>

            </div>
        </div>
    );
}