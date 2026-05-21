# imageResize Lambda

Resizes images from `originals/` in the originals bucket and writes `resized/` and `thumbnails/` keys to the resized bucket.

## AWS settings

| Setting | Value |
|--------|--------|
| Function name | `minijira-image-resize` |
| Runtime | Node.js **18.x** |
| Handler | `index.handler` |
| Memory | 512 MB (recommended) |
| Timeout | 30 s |
| Env `S3_RESIZED_BUCKET` | e.g. `minijira-images-resized` |
| Trigger | S3 `ObjectCreated` on originals bucket, prefix `originals/` |

IAM: read originals bucket, write resized bucket.

## Package on Windows (this repo)

**If `npm` is not recognized** (terminal opened before Node install), use either:

```powershell
# Option A — no npm on PATH needed
cd C:\Users\hamza\MiniJira\backend\lambda\imageResize
powershell -NoProfile -ExecutionPolicy Bypass -File .\package.ps1
```

```cmd
REM Option B — from repo root
package-imageResize.cmd
```

**After installing Node.js**, open a **new** terminal, then:

```powershell
npm run lambda:package:imageResize
```

Or refresh PATH in the current window:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm run lambda:package:imageResize
```

Upload `function.zip` in the Lambda console.

### If `sharp` fails at runtime

Use layer-only packaging (handler + SDK only; attach a **sharp** layer built for Node 18 / Amazon Linux):

```powershell
.\package.ps1 -LayerOnly
```

Then add a public sharp layer for your region/runtime in the Lambda console, or build one on Amazon Linux.

### PowerShell: `npm` / scripts disabled

If you see *running scripts is disabled*, do **not** use bare `npm` (it runs `npm.ps1`). Use:

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
```

Or run `package.ps1` / `package.cmd` (they call `npm.cmd` automatically).

### Requirements

- [Node.js LTS](https://nodejs.org/) — not only Cursor’s bundled `node.exe`
- After install, open a **new** terminal so `npm` is on PATH

```powershell
winget install OpenJS.NodeJS.LTS
```

Do **not** use `person5/lambdas/imageResize` — that path is not in this project.
