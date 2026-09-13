# Conscience64 / Play

Three small, free web applications built from ongoing project ideas. Open the [project hub](https://redogit.github.io/conscience64/play/).

| Project | Use it for | Take your work with you |
| --- | --- | --- |
| [Orbit Shelf](https://redogit.github.io/conscience64/play/orbit/) | Collect and search notes, source links, and writing-language metadata | Import/export a project file; optional browser storage |
| [Word Weave](https://redogit.github.io/conscience64/play/weave/) | Arrange lines of writing while preserving the original | Download the remix as text or export the complete project |
| [Pattern Garden](https://redogit.github.io/conscience64/play/garden/) | Explore a six-by-six pattern with shapes, rotation, mirroring, and undo | Download SVG with a title and description, a text representation, or the complete project |

No account, payment, backend, analytics, remote font, or package installation is needed to use the tools. Work stays in memory unless the person explicitly saves to their browser or downloads a file. Opening a source link makes a normal browser request to that website in another tab. Browser storage can be cleared or unavailable; exported files are portable backups. Do not rely on keeping an unsaved tab open as storage.

## Language and access

The first release includes English, Spanish, French, and Arabic interface translations. It supports Unicode writing in any language, optional language tags, and automatic text direction for user writing. Arabic switches the surrounding layout to right-to-left. Changing the interface language does not translate, normalize, or rewrite stored writing. Word Weave rearranges whole lines, retains blank lines, and normalizes line endings only in the exported remix; the original string remains in the project file.

The interfaces use native labeled form controls, visible keyboard focus, status announcements, logical CSS spacing, responsive layouts, shape distinctions beyond color, reduced-motion support, and forced-colors support. Pattern Garden uses arrow keys, Home/End, and Enter/Space; Tab enters the pattern once and then leaves it. Columns in this geometric grid always run left to right, including in Arabic layouts, as described in its instructions.

The first four translations are a starting point. They have not been reviewed by every language community. Automated browser checks do not establish universal accessibility, cultural suitability, or WCAG conformance. Screen-reader and community review are welcome through GitHub issues and pull requests. Add a locale to `assets/i18n.mjs`, add its native name to the page selectors, and keep translation keys complete. Never replace someone's writing with an interface translation. No symbols or templates are presented as belonging to or representing a particular tradition.

Implementation references: [W3C WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/), [W3C bidirectional markup guidance](https://www.w3.org/International/questions/qa-html-dir), and [Intl.Segmenter documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter). Character counts use grapheme segmentation where available; older browsers fall back to Unicode code-point counts.

## Run and verify

From the repository root, serve the static files:

```bash
python3 -m http.server 8000
# Open http://localhost:8000/play/
```

Run the dependency-free core checks with Node.js 22 or newer:

```bash
node play/test.mjs
```

For actual browser checks, install Google Chrome locally or use the included GitHub Actions gate, whose runner already supplies it:

```bash
node play/browser-test.mjs
# Or: CHROME_BIN=/path/to/chromium node play/browser-test.mjs
```

Browser checks use an isolated temporary browser profile, local HTTP server, and Chrome DevTools Protocol. They exercise all three tools, four interface languages, right-to-left layout, keyboard movement, save/load, imports, and narrow-screen overflow. They do not send user content anywhere. Deployment runs these checks before advancing `gh-pages`.

## Origins and rights

These are new implementations made for the user's GitHub rollout request, not recovered historical code. `projects.json` records the source project names, public documentation paths, and exact lineage commit. Orbit inspired useful navigation with source preservation; language/TBCL work inspired the original/remix boundary; geometry and creative world-building inspired Pattern Garden. These relationships do not transfer research authority or establish new scientific claims. Existing research checkpoints and their seven-project registry remain separate.

The MIT license in this directory applies to the new code and documentation under `play/`. It does not relicense the surrounding repository, linked sources, historical archives, or material entered by users. The built-in examples are newly written neutral prompts. Users retain their rights and responsibilities for their own content.

## Data format

Exports use `conscience64.play/v1`, an explicit application ID, and validated data. Imports reject another application's files, invalid URLs, duplicate identifiers, invalid pattern states, and corrupt line-order permutations. The file limit is 32 MB, large enough for the bounded note collection. No imported text is interpreted as HTML, JavaScript, or a command. SVG exports contain only generated geometry and escaped text metadata.
