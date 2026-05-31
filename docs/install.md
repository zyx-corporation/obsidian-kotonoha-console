# Obsidian Kotonoha Console — Installation

**Plugin:** `obsidian-kotonoha-console` v0.3.1  
**Manifest id:** `kotonoha-console`  
**Japanese:** [`install.ja.md`](install.ja.md)  
**Backend setup:** [`backend-setup.md`](backend-setup.md)

---

## Prerequisites

| Item | Requirement |
| --- | --- |
| Obsidian | **1.4.0+** (`minAppVersion` in `manifest.json`) |
| Distribution | GitHub Release binary assets (not yet in Community plugins catalog) |
| CLI backend | [`kotonoha >= 0.3.1`](https://github.com/zyx-corporation/kotonoha-docs/blob/main/en/tutorials/install_kotonoha_cli.md) |
| mock / http backend | No CLI (HTTP proposals need [orchestrator](backend-setup.md#mode-c-http-orchestrator) |

---

## Quick start

| Goal | Steps |
| --- | --- |
| UI only | Install plugin → enable → Backend `mock` |
| CLI RDE audit | Plugin + [CLI >= 0.3.1](https://github.com/zyx-corporation/kotonoha-docs/blob/main/en/tutorials/install_kotonoha_cli.md) → Backend `cli` |
| LLM summarize | Plugin + [start orchestrator](backend-setup.md#mode-c-http-orchestrator) → Backend `http` |

See [`backend-setup.md`](backend-setup.md).

## 1. Download release assets

Latest release: [obsidian-kotonoha-console Releases](https://github.com/zyx-corporation/obsidian-kotonoha-console/releases)

From v0.3.1:

| Method | Asset |
| --- | --- |
| **Zip (recommended)** | `kotonoha-console-v0.3.1.zip` |
| Individual files | `main.js`, `manifest.json`, `styles.css` |

v0.3.0 zip (`obsidian-kotonoha-console-v0.3.0.zip`) requires renaming the folder to `kotonoha-console`.

---

## 2. Install into your vault

### Recommended path (matches manifest id)

```text
<vault>/.obsidian/plugins/kotonoha-console/
├── main.js
├── manifest.json
└── styles.css
```

### From zip (v0.3.1+)

The zip contains `kotonoha-console/` — place it directly under `.obsidian/plugins/`.

```bash
cd /path/to/your-vault/.obsidian/plugins
unzip ~/Downloads/kotonoha-console-v0.3.1.zip
```

### From zip (v0.3.0)

Rename `obsidian-kotonoha-console/` to `kotonoha-console` after unzip.

### From individual assets

Copy all three files into the directory above. Checksums are attached to the release as `*.sha256`.

---

## 3. Enable in Obsidian

1. Open or reload the vault
2. **Settings → Community plugins** → turn **Restricted mode OFF** (required on first use)
3. Enable **Kotonoha Console**
4. If upgrading, toggle the plugin OFF then ON to reload

---

## 4. Initial settings

**Settings → Kotonoha Console**

| Setting | First-run suggestion |
| --- | --- |
| Backend | `mock` or `http` |
| sidecarMode | on |
| gitMode | `off` or `passive-observing` |

For CLI backend, install the CLI first, then set the binary path. See [`cli-runtime-compatibility.md`](cli-runtime-compatibility.md).

---

## 5. Smoke test

1. Open a Markdown note
2. Command palette → open Kotonoha Console or run RDE audit on active note
3. Generate a proposal and confirm Apply shows a confirmation dialog

Acceptance checklist: [`dogfood-acceptance.md`](dogfood-acceptance.md)

---

## Developers (build from source)

```bash
npm ci && npm run build
npm run link:dev-vault
```

See [`IMPLEMENTATION.md`](../IMPLEMENTATION.md).

---

## Related

- [`README.md`](../README.md)
- [kotonoha-docs — Install Obsidian plugin](https://github.com/zyx-corporation/kotonoha-docs/blob/main/en/manual/install_obsidian_kotonoha_console.md)
