/**
 * Check if the currently authenticated user owns the resource or is an admin.
 * 
 * @param {string|Object} resourceUserId - User ID attached to the resource
 * @param {Object} currentUser - User object from req.user
 * @param {boolean} [allowAdmin=true] - Whether admin role can bypass ownership check
 * @returns {boolean} True if owned or authorized
 */
const isOwnerOrAdmin = (resourceUserId, currentUser, allowAdmin = true) => {
  if (!currentUser) return false;

  if (allowAdmin && currentUser.role === 'admin') {
    return true;
  }

  const ownerId = resourceUserId && resourceUserId._id
    ? resourceUserId._id.toString()
    : resourceUserId.toString();

  const currentUserId = currentUser._id
    ? currentUser._id.toString()
    : currentUser.id?.toString();

  return ownerId === currentUserId;
};

/**
 * Asserts resource ownership or throws a 403 Forbidden error
 * 
 * @param {string|Object} resourceUserId - User ID attached to the resource
 * @param {Object} currentUser - User object from req.user
 * @param {string} [resourceName='Resource'] - Name of resource for error message
 * @param {boolean} [allowAdmin=true] - Whether admin role can bypass ownership
 */
const assertOwnership = (resourceUserId, currentUser, resourceName = 'Resource', allowAdmin = true) => {
  if (!isOwnerOrAdmin(resourceUserId, currentUser, allowAdmin)) {
    const error = new Error(`Access denied: You do not have permission to access or modify this ${resourceName}`);
    error.statusCode = 403;
    throw error;
  }
};

module.exports = {
  isOwnerOrAdmin,
  assertOwnership,
};
