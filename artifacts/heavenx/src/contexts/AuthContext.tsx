const login = useCallback(async (username: string, password: string, rememberMe = false) => {
  // Login deaktiviert
  setUser({
    id: "admin-001",
    username: "dexter",
    email: "admin@heavenx.com",
    role: "ADMIN",
    isActive: true,
    language: "DE",
    readMode: "default",
    darkMode: true,
    deviceLockMode: "UNLIMITED",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  });
}, []);