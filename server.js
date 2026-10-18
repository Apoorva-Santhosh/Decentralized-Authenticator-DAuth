import { createApp } from './server/app.js';

const app = await createApp();
const port = process.env.PORT || 3000;
app.listen(port, '127.0.0.1', () => console.log(`Server is running on http://localhost:${port}`));
