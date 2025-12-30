// Role-based guard. If user.role is DEVELOPER, grant access to everything.
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const role = (req.user?.role || '').toUpperCase();
    if (!role) return res.status(403).json({ error: 'Forbidden' });

    if (role === 'DEVELOPER') return next();
    if (!allowedRoles.map((r) => r.toUpperCase()).includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
