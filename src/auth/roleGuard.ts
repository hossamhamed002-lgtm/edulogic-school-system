import { User } from '../context/AuthContext';

export const isAdmin = (user?: User | null) => (user?.role || '').toUpperCase() === 'ADMIN';
export const isStaff = (user?: User | null) => (user?.role || '').toUpperCase() === 'STAFF';
export const isDeveloper = (user?: User | null) => (user?.role || '').toUpperCase() === 'DEVELOPER';

