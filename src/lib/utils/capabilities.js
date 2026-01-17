/**
 * Check if capabilities array includes a specific capability.
 * Also handles wildcard (*) capability.
 */
export function hasCapability(capabilities, cap) {
  if (!capabilities || !Array.isArray(capabilities)) return false;
  if (capabilities.includes('*')) return true;
  return capabilities.includes(cap);
}

/**
 * Check if capabilities array includes any of the given capabilities.
 */
export function hasAnyCapability(capabilities, caps) {
  if (!capabilities || !Array.isArray(capabilities)) return false;
  if (capabilities.includes('*')) return true;
  return caps.some(cap => capabilities.includes(cap));
}

/**
 * Check if capabilities array includes all of the given capabilities.
 */
export function hasAllCapabilities(capabilities, caps) {
  if (!capabilities || !Array.isArray(capabilities)) return false;
  if (capabilities.includes('*')) return true;
  return caps.every(cap => capabilities.includes(cap));
}
