# Conscience64 Image Generation AI

Conscience64 includes a provider-agnostic browser companion at `space-lens-image-gen.js`.

## Browser API

```js
Conscience64ImageGen.capabilities()
Conscience64ImageGen.generate({
  prompt: 'a geometric research observatory above an ocean at night',
  size: '1024x1024',
  n: 1
})
```

The companion adds an **Image** action to Space Lens and renders returned images in an accessible gallery.

## Provider model

Conscience64 does not embed provider credentials in the public site. Generation uses one of two transports.

### 1. Injected runtime/local provider

A host runtime can inject:

```js
globalThis.Conscience64ImageProvider = {
  name: 'local-image-model',
  async generate(request) {
    // Run a local model, WebGPU worker, desktop bridge, or trusted provider.
    // Return { images: [{ url }], provider: 'local-image-model' }.
  }
};
```

### 2. Same-origin HTTP backend

Without an injected provider, the companion POSTs JSON to:

```text
/api/image-generate
```

Example request:

```json
{
  "schema": "conscience64/image-generation/v1",
  "prompt": "a geometric research observatory above an ocean at night",
  "size": "1024x1024",
  "n": 1,
  "transparent_background": false,
  "metadata": {
    "source": "Conscience64ImageGen",
    "requestedAt": "..."
  }
}
```

Accepted response shapes include:

```json
{
  "provider": "example-model",
  "images": [
    {"url": "https://.../image.png"}
  ]
}
```

or an image array under `data`, including base64 fields such as `b64_json`. A backend may also return an image response directly with an `image/*` content type.

## Runtime configuration

A trusted runtime may change the endpoint in memory:

```js
Conscience64ImageGen.configure({
  endpoint: '/my-image-service'
});
```

Cross-origin endpoints are rejected by default. They can be enabled explicitly for a trusted service:

```js
Conscience64ImageGen.configure({
  endpoint: 'https://trusted.example/generate',
  allowCrossOrigin: true,
  credentials: 'omit'
});
```

No configuration or secret is persisted by the image-generation companion.

## Supported request bounds

- Prompt: required, maximum 4,000 characters.
- Negative prompt: optional, maximum 2,000 characters.
- Images per request: 1–4.
- Sizes: `1024x1024`, `1536x1024`, `1024x1536`, or `auto`.

The image provider remains responsible for enforcing its own model, safety, licensing, and content rules. Conscience64 does not implement a policy-bypass path.

## postMessage bridge

Request:

```js
otherWindow.postMessage({
  type: 'conscience64.image.generate',
  id: 'img-1',
  request: {prompt: 'a 4D compass-rose visualization'}
}, '*');
```

Response:

```js
{
  type: 'conscience64.image.result',
  id: 'img-1',
  ok: true,
  result: { ... }
}
```

## Smoke test

```bash
node tools/test-image-gen.mjs
```

The smoke test verifies request normalization, invalid-input rejection, the no-persisted-secret invariant, and execution through an injected mock provider.
