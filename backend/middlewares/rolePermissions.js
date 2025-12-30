export default function rolePermissions(req, res, next) {
  const role = (req.user?.role || '').toUpperCase();
  const path = req.path || '';
  const method = (req.method || '').toUpperCase();

  // Allow unauthenticated paths handled before this middleware
  if (!role) return res.status(401).json({ message: 'Unauthorized' });

  // ADMIN: allow everything
  if (role === 'ADMIN') return next();

  // STAFF: block write on finance/settings
  if (role === 'STAFF') {
    const isFinance = path.startsWith('/finance/');
    const isSettings = path.startsWith('/settings/');
    const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    if (isWrite && (isFinance || isSettings)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  }

  // DEVELOPER: allow only settings and audit
  if (role === 'DEVELOPER') {
    const allowed = path.startsWith('/settings/') || path.startsWith('/audit/');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });
    return next();
  }

  return res.status(403).json({ error: 'Forbidden' });
}

