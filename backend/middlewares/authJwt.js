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
      scope: decoded.scope
    };

    if (
      req.params?.schoolCode &&
      req.user.role?.toUpperCase() !== 'DEVELOPER' &&
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
