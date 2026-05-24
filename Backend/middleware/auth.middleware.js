import jwt from "jsonwebtoken";
import { isTokenBlacklisted } from "../models/blacklistedTokens.js";
import { findUserById } from "../models/user.model.js";

/**
 * AUTHENTICATE - Verify JWT token and attach user to request
 */
// Alias for backward compatibility or legacy code
export const authMiddleware = async (req, res, next) => authenticate(req, res, next);

export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.replace("Bearer ", "");

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return res.status(401).json({ message: "Token is blacklisted. Please login again." });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    // Fetch user from database
    const user = await findUserById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    // Attach user and token to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    if (error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

/**
 * AUTHORIZE ROLES - Protect routes based on roles (Admin / Employee)
 * Usage: authorizeRoles("Admin"), authorizeRoles("Employee", "Admin")
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user && (req.user.role || req.user.designation);
    if (!req.user || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: You do not have access to this resource" });
    }
    next();
  };
};

// Optional auth: parse token if present, but don't reject requests without token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return next();

    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      console.warn('optionalAuth: token blacklisted');
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
      req.token = token;
    } catch (err) {
      console.warn('optionalAuth: token invalid', err.message);
      // ignore invalid token, don't block request
    }
    return next();
  } catch (err) {
    console.error('optionalAuth error', err);
    return next();
  }
};