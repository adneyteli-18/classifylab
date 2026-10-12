# ClassifyLab

ClassifyLab is a browser-only K-Nearest Neighbors virtual lab. It supports
dataset inspection and preparation, a train/test split, KNN classification,
test-set evaluation, an exercise, a drift demonstration, and local experiment
history. No backend or database is required.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build and preview

```sh
npm run lint
npm run build
npm run preview
```

The static production files are written to `dist/`. Deploy that directory to
any static host that serves `index.html` for the site root.

For a project site hosted from a subpath (for example, GitHub Pages at
`https://example.github.io/classifylab/`), set the Vite base path while building:

```powershell
$env:VITE_BASE_PATH = "/classifylab/"
npm.cmd run build
```

For a root-domain static host, the default `/` base path is correct.

## Dataset format

Upload a CSV with one or more numeric feature columns and a categorical label
column. `label`, `class`, `target`, or `species` are recognized as the label
column names; otherwise the final column is treated as the label. Blank feature
or label values are counted during inspection and incomplete rows are excluded
from the train/test split. CSV uploads are limited to 2 MB and 10,000 rows.

The bundled Iris dataset is the classic Fisher Iris dataset, sourced from the
[UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/53/iris).
It is included as a local CSV so it also works when deployed without a backend
or a runtime dataset download.

## Evaluation notes

The train/test split is deterministic for a given seed and stratified by class.
When enabled, standardization is fitted on training rows only and those same
training statistics are applied to test rows. The optional leakage demonstration
also computes a clearly labeled, intentionally invalid comparison in which
test-feature values are included while fitting the scaler.

Precision, recall, and F1 are macro-averaged across classes. Undefined
per-class precision or recall is reported as zero. Saved experiments and
datasets live in this browser's LocalStorage and are not synchronized across
devices.
