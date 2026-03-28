import app from "./src/app";

import { serve } from "bun";

serve({ fetch: app.fetch, port: 3000 });

console.log(`Server is running on http://localhost:3000`);
