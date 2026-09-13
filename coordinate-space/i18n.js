/* Presentation only. Neither locales nor the wall clock enter source identity. */
'use strict';
(function(root) {
  const SCHEMA = 'coordinate-language/v1', LIMIT = 131072;
  const core = root.CoordinateLanguagePacks[0];
  const keys = Object.keys(core.messages).sort();
  const packs = new Map();
  function tag(value) {
    if (typeof value !== 'string' || value.length > 100 || !value.trim()) throw Error('E_LANGUAGE');
    const tags = Intl.getCanonicalLocales(value.trim());
    if (tags.length !== 1) throw Error('E_LANGUAGE');
    return tags[0];
  }
  function validate(pack) {
    if (!pack || typeof pack !== 'object' || Array.isArray(pack) ||
        Object.keys(pack).sort().join('|') !== 'direction|locale|messages|nativeName|schema' || pack.schema !== SCHEMA) throw Error('E_LANGUAGE_PACK');
    const locale = tag(pack.locale);
    if (!['ltr','rtl'].includes(pack.direction) || typeof pack.nativeName !== 'string' || !pack.nativeName.trim() ||
        pack.nativeName.length > 80 || !pack.nativeName.isWellFormed() || /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(pack.nativeName)) throw Error('E_LANGUAGE_PACK');
    if (!pack.messages || typeof pack.messages !== 'object' || Array.isArray(pack.messages) ||
        Object.keys(pack.messages).sort().join('|') !== keys.join('|')) throw Error('E_LANGUAGE_PACK');
    const messages = Object.create(null);
    for (const key of keys) {
      const value = pack.messages[key];
      if (typeof value !== 'string' || !value.trim() || value.length > 1000 || !value.isWellFormed() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) throw Error('E_LANGUAGE_PACK');
      messages[key] = value;
    }
    return Object.freeze({schema:SCHEMA, locale, nativeName:pack.nativeName, direction:pack.direction, messages:Object.freeze(messages)});
  }
  for (const value of root.CoordinateLanguagePacks) { const p = validate(value); if (packs.has(p.locale)) throw Error('E_DUPLICATE_LOCALE'); packs.set(p.locale,p); }
  // Do not map a specifically requested script to a different script.
  function resolve(requested) {
    try {
      const loc = new Intl.Locale(tag(requested));
      if (packs.has(loc.baseName)) return loc.baseName;
      const script = loc.maximize().script;
      const candidates = [...packs.keys()].filter(k => { const p = new Intl.Locale(k); return p.language === loc.language && p.maximize().script === script; });
      return candidates[0] || 'en';
    } catch { return 'en'; }
  }
  function importText(text) {
    if (typeof text !== 'string' || new TextEncoder().encode(text).length > LIMIT) throw Error('E_LANGUAGE_PACK');
    const p = validate(JSON.parse(text));
    if (!packs.has(p.locale) && packs.size >= 64) throw Error('E_LANGUAGE_PACK_LIMIT');
    packs.set(p.locale,p);
    return p;
  }
  function get(locale) { if (!packs.has(locale)) throw Error('E_LANGUAGE'); return packs.get(locale); }
  function number(n,locale) { return new Intl.NumberFormat(locale, {maximumFractionDigits:0}).format(n); }
  function template(locale='en') { return JSON.stringify(get(locale),null,2); }
  root.CoordinateI18n = Object.freeze({tag,validate,resolve,importText,get,number,template,limit:LIMIT,keys:Object.freeze(keys),list:()=>[...packs.values()]});
})(globalThis);
