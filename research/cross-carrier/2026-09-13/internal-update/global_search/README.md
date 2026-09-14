# Orbit Search and internal workspace

## Start

Open `index.html` for immediately usable search links and the 4D → 3D scene.
For inline research retrieval and the internal browser workspace, install Node.js 22+ and Python 3.10+, then run from this directory:

```sh
npm ci
npx playwright install chromium
python3 serve.py
```

Open http://127.0.0.1:8765. Search is the main view; secondary tools are collapsed.
On compatible Linux systems the included portable Chromium dependency can be selected with `ORBIT_PORTABLE_CHROMIUM=1 python3 serve.py` instead of downloading Playwright Chromium. Network access and trusted system certificates are prerequisites for public browsing. The worker honors HTTPS_PROXY, validates certificates, and never attaches to an existing browser.

## What changed

- 65 enabled search services; 248 country/territory profiles, excluding Russia. All routes are available by default. This is worldwide routing coverage, not 248 locally owned engines or a claim that every service was live-tested.
- Crossref and Europe PMC load metadata in the local UI; other services open native search pages or explicitly labelled Brave site searches. No paid general-web API access is invented.
- Known Russian providers/domains are excluded. Hidden upstream affiliations and every indexed document's origin cannot be guaranteed.
- Kept leads preserve source identity and export a working packet. `import_working_packet.py` routes that packet through the recovered TBCL serializer and Orbit quarantine. It does not ratify source claims.
- A separate headless Chromium context executes actual mouse and touch input. The visible page has no shared cookies, storage, account session, or desktop pointer connection to it. The small Internal workspace panel starts a test or public-page inspection and shows its activity log.
- Internal click/tap commands verify the expected target at a CSS-pixel coordinate and check a page-side receipt. The included target is deliberately local and has no external effects. Public browsing allows HTTPS reading, movement, and scrolling; external activation needs a separately scoped adapter. This release does not automate arbitrary third-party account workflows.
- Browser actions run on a separate page, not Shadow DOM. A hidden iframe cannot grant unrestricted access across websites. Public pages may refuse access or require scripts/login; the read context disables scripts and sends no state-changing HTTP methods. This is an application boundary, not a claim of a hardened network sandbox against hostile DNS.
- The black-hole scene projects rotating four-coordinate Float64 points into three spatial dimensions, then uses camera projection and depth ordering. The fourth coordinate is a geometric axis, not physical time. It is illustrative, not a general-relativity simulation. Animation respects reduced motion and stops updating when the panel is closed.

## Internal carrier interface

```sh
node shadow.cjs < shadow-task.json
```

Input is an explicit task with at most 50 actions. Viewport coordinates are 1024 × 768 CSS pixels. The worker exports `run(task)`, `point(action)`, and `publicURL(url)` for other internal processes. Supported actions: observe, move, scroll, and internal click/touch. No arbitrary JavaScript or shell execution is accepted from task packets. Results use `orbit-shadow/1`, with activity receipts and no authority transfer. Logs are returned to the caller; retain/export them as needed. A failed run returns an error, not a fabricated success receipt.

`GlobalSearchCarrier` in `search.py` accepts an explicit search query and returns candidate metadata with retrieval provenance. Existing cross-carrier sources remain in the parent bundle. The original black-hole app is preserved under `legacy/`; the new view reuses its Float64 coordinate convention but does not replace its original renderer pipeline or claim to connect every historical process.

## Validation, 2026-09-13

- 15 search policy/routing tests passed, including all routes across all country profiles.
- Crossref and Europe PMC returned 10 candidate records in the earlier live run (`live_results.json`).
- TBCL/Orbit working-packet import reconstructed exact bytes and remained QUARANTINED (`import_validation.json`).
- Real headless mouse and touch receipts matched (320,220) and (280,200), with trusted browser input events (`shadow-validation.json`).
- Browser UI: 65 routes, 248 country choices, projection finite/center checks, no script errors, no horizontal overflow at 390 and 320 pixels. Screenshots included.
- End-to-end workspace endpoint passed: visible-page query and URL unchanged; invalid points/targets, excluded providers, and foreign-Origin requests rejected. Portable Chromium flags that disable web security/site isolation are removed.
- Public Chromium navigation to example.org failed certificate validation behind the execution environment's proxy. Certificate checks remain enabled. Public browsing is implemented but was not successfully validated here.

Run `python3 -m pytest test_search.py -q`, `node verify-ui.cjs`, and `node verify-workspace.cjs` to repeat the targeted checks. Browser tests use the portable Linux dependency. Python catalog regeneration additionally needs pycountry; ordinary app startup does not.

## References

[Playwright mouse](https://playwright.dev/docs/api/class-mouse), [touchscreen](https://playwright.dev/docs/api/class-touchscreen), [browser contexts](https://playwright.dev/docs/browser-contexts), [Crossref REST](https://www.crossref.org/documentation/retrieve-metadata/rest-api/), [Europe PMC REST](https://europepmc.org/RestfulWebService), [SearXNG engine reference](https://docs.searxng.org/user/configured_engines.html).

## Publication successor — 2026-09-14

The workspace asks for a learning goal and preservation boundary before public inspection. It also asks what is already known, which prior sources matter, who will use the result, and what a useful answer contains. The four fields are required by the UI and local API and included as user-provided context in the result. These answers do not expand worker permissions. Existing approval covers continuing this update; consequential external actions remain outside this worker.
