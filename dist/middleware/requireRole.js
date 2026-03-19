export function requireRole(...allowed) {
    return (req, res, next) => {
        const role = req.auth?.role;
        if (!role)
            return res.status(401).json({ error: 'unauthorized' });
        if (!allowed.includes(role))
            return res.status(403).json({ error: 'forbidden' });
        return next();
    };
}
