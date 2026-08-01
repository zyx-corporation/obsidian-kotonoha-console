# Obsidian Kotonoha Console — Installation

**Plugin:** `obsidian-kotonoha-console` **v0.5.3**\
**Manifest id:** `kotonoha-console`  
**Japanese:** [`install.ja.md`](install.ja.md)  
**Backend setup:** [`backend-setup.md`](backend-setup.md)

---

## Prerequisites

| Item | Requirement |
| --- | --- |
| Obsidian | **1.7.2+** |
| Release | [0.5.3](https://github.com/zyx-corporation/obsidian-kotonoha-console/releases/tag/0.5.3) |
| CLI backend | [`kotonoha-cli >= 0.3.1`](https://github.com/zyx-corporation/kotonoha-docs/blob/main/en/tutorials/install_kotonoha_cli.md) |
| mock / http | No CLI (HTTP needs [orchestrator](backend-setup.md#mode-c-http-orchestrator)) |

---

## Quick start

| Goal | Steps |
| --- | --- |
| UI only | Install plugin → enable → Backend `mock` |
| CLI RDE audit | Plugin + CLI >= 0.3.1 → Backend `cli` |
| LLM summarize | Plugin + orchestrator → Backend `http` |

See [`backend-setup.md`](backend-setup.md).

---

## Install path

```text
<vault>/.obsidian/plugins/kotonoha-console/
```

Download **`main.js`**, **`manifest.json`**, and **`styles.css`** from the release, then place them under `.obsidian/plugins/kotonoha-console/`.

Kotonoha Console is currently desktop-only.

---

## Enable

Settings → Community plugins → Restricted mode OFF → Enable Kotonoha Console.

Backend setup: [`backend-setup.md`](backend-setup.md).

---

## Related

- [`README.md`](../README.md)
