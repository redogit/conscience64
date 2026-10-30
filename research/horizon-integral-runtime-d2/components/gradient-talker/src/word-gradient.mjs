export const composition = 'ordered-cumulative-v1';

function assertCondition(ok, message) { if (!ok) throw Error(message); }
function colorFor(i) {
  const stops = [[24,12,20],[173,36,68],[255,243,237]], t = (i * 0.6180339887498949) % 1, p = t * 2,
    j = Math.min(1, Math.floor(p)), f = p - j;
  return '#' + stops[j].map((v,k) => Math.round(v + (stops[j+1][k] - v) * f).toString(16).padStart(2,'0')).join('');
}
export function combine(left, right, id) {
  return {kind:'compose', id, left, right, wordCount:(left ? left.wordCount : 0) + (right ? right.wordCount : 0)};
}
function scope(child, id, level) { return {kind:'scope', id, level, child, wordCount:child ? child.wordCount : 0}; }
export function orderedWords(gradient) {
  if (Array.isArray(gradient)) return gradient;
  const result = [], stack = gradient ? [gradient] : [];
  while (stack.length) {
    const x = stack.pop();
    if (!x) continue;
    if (x.kind === 'word') result.push(x.leaf);
    else if (x.kind === 'scope') stack.push(x.child);
    else { stack.push(x.right); stack.push(x.left); }
  }
  return result;
}
function foldChildren(children, field, ownField, path) {
  let prefix = null;
  children.forEach((child, i) => {
    prefix = combine(prefix, child[ownField], path + '/prefix-' + (i + 1));
    child[field] = prefix;
    child.prefixIndex = i + 1;
  });
  return prefix;
}
export function compile(text, entries = [], reservedFloor = 0) {
  assertCondition(Number.isSafeInteger(reservedFloor) && reservedFloor >= 0 && reservedFloor < Number.MAX_SAFE_INTEGER, 'Invalid reserved identity floor.');
  assertCondition(typeof text === 'string' && text.length <= 12000, 'Source must contain at most 12,000 UTF-16 code units.');
  const dictionary = new Map(entries.map(e => [e.word, {...e}])), usedIds = new Set(entries.map(e => e.id));
  let next = reservedFloor + 1;
  function entry(word) {
    if (!dictionary.has(word)) {
      while (usedIds.has('lex-' + next)) next++;
      assertCondition(Number.isSafeInteger(next), 'Local identity namespace exhausted.');
      const id = 'lex-' + next++;
      usedIds.add(id);
      dictionary.set(word, {id, word, color:colorFor(dictionary.size)});
    }
    return dictionary.get(word);
  }
  const leaves = [], pages = [], books = [];
  let offset = 0;
  const bookTexts = text.split('\u001e');
  bookTexts.forEach((bookText, bi) => {
    const book = {path:'book-' + (bi + 1), pages:[], leaves:[]};
    const pageTexts = bookText.split('\f');
    pageTexts.forEach((pageText, pi) => {
      const page = {path:book.path + '/page-' + (pi + 1), paragraphs:[], leaves:[]};
      let local = 0;
      const paragraphs = pageText.split(/(\n[\t ]*\n+)/u);
      paragraphs.forEach(part => {
        if (/^\n[\t ]*\n+$/u.test(part)) { local += part.length; return; }
        const para = {path:page.path + '/paragraph-' + (page.paragraphs.length + 1), sentences:[], leaves:[]};
        const sentences = part.match(/[^.!?。！？]+[.!?。！？]*|[.!?。！？]+/gu) || [];
        let sentenceOffset = 0;
        sentences.forEach((sentenceText, si) => {
          const sent = {path:para.path + '/sentence-' + (si + 1), raw:sentenceText, parts:[], leaves:[]};
          const re = /[\p{L}\p{N}\p{M}_]+(?:[’'][\p{L}\p{N}\p{M}_]+)*/gu;
          let end = 0, match, wordGradient = null;
          while ((match = re.exec(sentenceText)) !== null) {
            if (match.index > end) sent.parts.push({raw:sentenceText.slice(end, match.index)});
            const e = entry(match[0]);
            const start = offset + local + sentenceOffset + match.index;
            const leaf = {id:e.id, word:e.word, color:e.color, start, end:start + match[0].length, path:sent.path + '/token-' + (sent.leaves.length + 1), occurrence:'occ-' + start};
            sent.parts.push(leaf); sent.leaves.push(leaf); leaves.push(leaf);
            const word = {kind:'word', id:leaf.path, leaf, wordCount:1};
            wordGradient = combine(wordGradient, word, sent.path + '/word-prefix-' + sent.leaves.length);
            end = match.index + match[0].length;
          }
          if (end < sentenceText.length) sent.parts.push({raw:sentenceText.slice(end)});
          sent.gradient = scope(wordGradient, sent.path, 'sentence');
          para.sentences.push(sent); para.leaves.push(...sent.leaves);
          sentenceOffset += sentenceText.length;
        });
        assertCondition(para.sentences.map(s => s.raw).join('') === part, 'Sentence segmentation lost characters.');
        para.gradient = scope(foldChildren(para.sentences, 'cumulativeGradient', 'gradient', para.path), para.path, 'paragraph');
        page.paragraphs.push(para); page.leaves.push(...para.leaves); local += part.length;
      });
      assertCondition(local === pageText.length, 'Page offsets failed.');
      page.gradient = scope(foldChildren(page.paragraphs, 'cumulativeGradient', 'gradient', page.path), page.path, 'page');
      book.pages.push(page); pages.push(page); book.leaves.push(...page.leaves);
      offset += pageText.length + (pi < pageTexts.length - 1 ? 1 : 0);
    });
    book.gradient = scope(foldChildren(book.pages, 'cumulativeGradient', 'gradient', book.path), book.path, 'book');
    books.push(book);
    if (bi < bookTexts.length - 1) offset++;
  });
  const gradient = scope(foldChildren(books, 'cumulativeGradient', 'gradient', 'collection-1'), 'collection-1', 'collection');
  for (const leaf of leaves) assertCondition(text.slice(leaf.start, leaf.end) === leaf.word, 'Identity offset mismatch.');
  assertCondition(gradient.wordCount === leaves.length, 'Composition duplicated or lost word occurrences.');
  return {text, pages, books, leaves, gradient, entries:Array.from(dictionary.values()), rule:'utf16-lossless-v2-code-identifiers', composition};
}
export function displayWords(value, limit = 256) {
  const all = orderedWords(value);
  if (all.length <= limit) return all;
  return Array.from({length:limit}, (_,i) => all[Math.round(i * (all.length - 1) / (limit - 1))]);
}
export function transfer(doc, owner, source) {
  const raw = JSON.stringify({schema:'gradient-talker-v3', rule:doc.rule, composition:doc.composition, owner, text:doc.text, entries:doc.entries, source}, null, 2);
  assertCondition(doc.entries.length <= 200000 && raw.length <= 33554432, 'Portable key exceeds 200,000 mappings or 32 MiB.');
  return raw;
}
export function gradient(value) {
  const leaves = displayWords(value);
  if (!leaves.length) return 'linear-gradient(90deg,#180c14,#180c14)';
  if (leaves.length === 1) return 'linear-gradient(90deg,' + leaves[0].color + ',' + leaves[0].color + ')';
  return 'linear-gradient(90deg,' + leaves.map((x,i) => x.color + ' ' + (100 * i / (leaves.length - 1)) + '%').join(',') + ')';
}
export function parseTransfer(raw) {
  assertCondition(raw.length <= 33554432, 'Transfer exceeds 32 MiB characters.');
  const x = JSON.parse(raw);
  assertCondition((x.schema === 'gradient-talker-v1' || x.schema === 'gradient-talker-v2' || x.schema === 'gradient-talker-v3') && (x.rule === 'utf16-lossless-v1' || x.rule === 'utf16-lossless-v2-code-identifiers'), 'Unsupported transfer schema or segmentation rule.');
  if (x.schema === 'gradient-talker-v2' || x.schema === 'gradient-talker-v3') assertCondition(x.composition === composition, 'Unsupported composition rule.');
  assertCondition(typeof x.owner === 'string' && x.owner.length <= 80, 'Invalid key owner.');
  assertCondition(typeof x.text === 'string' && x.text.length <= 12000, 'Invalid source.');
  assertCondition(Array.isArray(x.entries) && x.entries.length <= 200000, 'Invalid key.');
  const words = new Set(), ids = new Set();
  for (const e of x.entries) {
    assertCondition(e && typeof e.word === 'string' && e.word.length > 0 && typeof e.id === 'string' && /^lex-[1-9][0-9]*$/.test(e.id) && /^#[0-9a-fA-F]{6}$/.test(e.color), 'Invalid key entry.');
    assertCondition(!words.has(e.word) && !ids.has(e.id), 'Duplicate word or identity.');
    words.add(e.word); ids.add(e.id);
  }
  const doc = compile(x.text, x.entries);
  assertCondition(doc.entries.length === x.entries.length, 'Transfer key is missing source words.');
  return {owner:x.owner, doc, source:x.source && typeof x.source.source_id === 'string' ? {source_id:x.source.source_id, document_id:x.source.document_id || null, title:String(x.source.title || ''), excerpt:!!x.source.excerpt} : null};
}
