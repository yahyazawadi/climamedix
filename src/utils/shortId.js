/**
 * Utility to support short 7-8 char ID matching for courses and entities.
 * UUID prefix (first 7-8 characters without hyphen) is uniquely resolvable.
 */

export function toShortId(fullId) {
  if (!fullId || typeof fullId !== 'string') return '';
  return fullId.replace(/-/g, '').slice(0, 7);
}

export function matchEntityByShortOrFullId(list = [], idOrShort) {
  if (!idOrShort || !Array.isArray(list)) return null;
  const target = String(idOrShort).trim().toLowerCase();
  
  // 1. Direct exact match (full UUID or exact id)
  const exact = list.find(item => item?.id && String(item.id).toLowerCase() === target);
  if (exact) return exact;

  // 2. Short ID match (first 7 characters of stripped UUID or prefix)
  const cleanTarget = target.replace(/-/g, '');
  return list.find(item => {
    if (!item?.id) return false;
    const cleanItemId = String(item.id).toLowerCase().replace(/-/g, '');
    return cleanItemId.startsWith(cleanTarget) || cleanItemId.slice(0, cleanTarget.length) === cleanTarget;
  }) || null;
}
