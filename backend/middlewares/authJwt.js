import jwt from 'jsonwebtoken';

export default function authJwt(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET || 'dev-secret');
    req.user = {
      id: decoded.userId || decoded.id,
      role: decoded.role,
      schoolCode: decoded.schoolCode,
    scope: decoded.scope,
    source: decoded.source
  };

  const isImpersonation =
    req.user?.source === 'dev_impersonation' ||
    req.user?.impersonatedBy === 'developer';

  const role = (req.user.role || '').toUpperCase();
  const scope = (req.user.scope || '').toUpperCase();
  const source = (req.user.source || '').toUpperCase();
  const isDeveloper = role === 'DEVELOPER' || scope === 'SYSTEM' || source === 'DEVELOPER';

  if (
    req.params?.schoolCode &&
    !isImpersonation &&
    !isDeveloper &&
    req.user.schoolCode &&
    req.user.schoolCode !== req.params.schoolCode
  ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
