const API_URL = `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users`; 

export const login = async (email, password) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            return data;
        } else {
            throw new Error(data.message || "Login failed");
        }
    } catch (error) {
        throw error;
    }
};

export const logout = async () => {
    try {
        const token = localStorage.getItem("token");
        if (token) {
            await fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
        }
    } catch (error) {
        console.error("Logout error:", error);
    } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    }
};

export const getToken = () => {
    return localStorage.getItem("token");
};

export const isAuthenticated = () => {
    return !!localStorage.getItem("token");
};
