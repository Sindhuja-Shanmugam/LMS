exports.authorizeRoles = (...allowed) => (req, res, next) => {
  if (!req.user || !allowed.includes(req.user.emp_type)) {
    
    console.warn(`Unauthorized access attempt by user ${req.user?.id} with role ${req.user?.emp_type}`);
    return res.status(403).json({ message: 'Access denied: Insufficient role' });
  }
  next();
};
