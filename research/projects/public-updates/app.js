const statusNode = document.querySelector('#status');
const updatesNode = document.querySelector('#updates');
function el(name, text, className = '') { const node = document.createElement(name); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function sourceHref(path) { return '../../../' + path.split('/').map(encodeURIComponent).join('/'); }
async function main() {
  try {
    const response = await fetch('./data/latest.json', {cache: 'no-store'}); if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const snapshot = await response.json(); if (snapshot.schema !== 'conscience64/public-research-updates/v1' || !Array.isArray(snapshot.records)) throw new Error('unexpected snapshot schema');
    for (const record of snapshot.records) {
      const article = el('article', undefined, 'update'); article.append(el('h2', record.title)); article.append(el('p', record.summary));
      const source = el('a', 'Open source record'); source.href = sourceHref(record.source_path);
      const meta = el('p', `${record.published_at} · ${record.evidence_relation} · source ${record.source_blob_sha1.slice(0, 12)}…`, 'meta');
      article.append(source, meta); updatesNode.append(article);
    }
    statusNode.textContent = `${snapshot.record_count} explicitly admitted public update${snapshot.record_count === 1 ? '' : 's'}.`;
  } catch (error) { statusNode.textContent = `Public update feed unavailable: ${error.message}`; }
}
main();
