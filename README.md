# Sclerite-rs

**Sclerite** is a high-performance image watermarking engine. It consists of a Rust-based WASM processing core deployed as a Cloudflare Worker and a minimalist React frontend.

The goal is simple: pixel-perfect watermarking at the edge with zero egress overhead.

## Architecture

* **Engine (`/engine`)**: A Rust crate using the `image` crate for low-level pixel manipulation. Compiled to WASM and wrapped in a Cloudflare Worker via `workers-rs`.
* **Interface (`/interface`)**: A Vite-powered React SPA. Uses CSS for real-time layout previews and offloads the final high-resolution render to the WASM engine.

## Features

* **WASM Processing**: Image compositing happens in a memory-safe, high-speed sandbox.
* **Edge Native**: Distributed globally via Cloudflare’s network. Sub-10ms execution for standard assets.
* **Pattern Layouts**: Supports Center, Tiled, Diagonal, and Corner positioning logic.
* **Sclerotized Headers**: Hardened CORS policies driven by environment variables.

## Technical Specifications

### API Protocol

The engine listens for `POST` requests at `/watermark` with `multipart/form-data`:

| Field | Type | Description |
| --- | --- | --- |
| `image` | File (PNG/JPG) | The base asset to be protected. |
| `watermark` | File (PNG) | The watermark overlay. |
| `pattern` | String | `center`, `tiled`, `diagonal`, or `corners`. |
| `opacity` | Float | 0.0 to 1.0. |

### Build Requirements

* Rust (stable) + `wasm32-unknown-unknown` target.
* Node.js 20+
* Wrangler CLI

## Setup

### Backend

```bash
cd engine
npx wrangler deploy

```

### Frontend

```bash
cd interface
npm install
npm run build

```
