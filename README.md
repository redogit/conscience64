# Conscience64

Privacy-safe universal research space hosted as a static GitHub Pages application.

Visible surface: **I / R / P / O**.

Browser API: `window.Conscience64API`.

Examples:
```js
Conscience64API.search.simple("black hole quantum")
Conscience64API.search.advanced({ text: "language", minDegree: 5 })
Conscience64API.get("project:physics")
Conscience64API.traverse("project:orbit", { depth: 2 })
Conscience64API.irpo({ I: "black hole", R: {}, P: { action: "search.simple" } })
```

Every searchable object has a deterministic `uoid:sha256:...` identifier and microdata.

The published corpus is privacy-safe; personal/family/private information is outside the site.
