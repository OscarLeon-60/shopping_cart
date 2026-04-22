import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [role, setRole] = useState(localStorage.getItem("role") || null);
    const [userName, setUserName] = useState(localStorage.getItem("userName") || null);

    const login = (newToken, newRole, newName) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("role", newRole);
        localStorage.setItem("userName", newName);
        setToken(newToken);
        setRole(newRole);
        setUserName(newName);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userName");
        localStorage.removeItem("localCart"); // Limpiar carrito al logout
        setToken(null);
        setRole(null);
        setUserName(null);
    };

    return (
        <AuthContext.Provider value={{ token, role, userName, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}