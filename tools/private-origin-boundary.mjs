export const PRIVATE_ORIGIN_BOUNDARIES=Object.freeze([
  'PRIVATE METHOD MAY INFORM SOLVING',
  'PRIVATE SOURCE MUST NOT PROPAGATE',
  'PRIVATE_ORIGIN != SEARCHABLE_CORPUS',
  'PRIVATE_ORIGIN != SEARCHABLE_GRAPH'
]);

export function hasRestrictedOriginMarker(value){
  if(!value||typeof value!=='object')return false;
  if(value.derived_from_private_history===true)return true;
  const origin=value.privacy_origin??value.privacyOrigin;
  return Boolean(
    origin
    && typeof origin==='object'
    && !Array.isArray(origin)
    && origin.classification==='private-history-method-only'
  );
}
