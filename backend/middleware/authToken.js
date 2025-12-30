import jwt from 'jsonwebtoken';

export default function authToken(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No token' });
    const [, token] = auth.split(' ');
    if (!token) return res.status(401).json({ message: 'Invalid token' });
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'JWT_SECRET not configured' });
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
