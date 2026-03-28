import app from "./src/app";
import { PORT } from "./src/config";

import { serve } from "bun";

const port = Number(PORT) || 3000;

serve({ fetch: app.fetch, port });

console.log(`Server is running on http://localhost:${port}`);
