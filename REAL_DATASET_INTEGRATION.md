# SARATHI - SIH 26134 Dataset Integration

This build contains the supplied SIH 26134 datasets under:

`backend/data/sih_134_datasets/`

The backend has a safe read-only API for the datasets. Existing prototype screens were not rewritten automatically, so the current project remains usable.

## Quick test

1. Open this folder in VS Code.
2. Run `run_backend.bat`.
3. Open `http://127.0.0.1:8000/docs`.
4. Find **Real Dataset**.
5. Try `GET /api/real-data/summary`.
6. Try `GET /api/real-data/indian-jobs`.

The React API helper is available at:

`src/api/realData.ts`

Import it with:

```ts
import { realDataAPI } from "./api";
```

Then, for example:

```ts
const response = await realDataAPI.indianJobs({ limit: 20 });
console.log(response);
```

For the next step, replace one existing mock data array at a time with the matching API response. Do not delete the original mock data until the API has been tested.

## Frontend integration updated

The **Demand & Trend Analytics** page now calls the Real Dataset API and displays a live dataset summary, sample Indian job records, and sample skills. This provides a visible end-to-end demonstration that the supplied datasets are being read by the FastAPI backend and consumed by React.

The existing dashboard/API flows were left intact.
