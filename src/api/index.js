import { createDemoApi } from './demo';
import { createRemoteApi } from './remote';

const apiUrl = import.meta.env.VITE_API_URL;

// With VITE_API_URL set, talk to the real backend; otherwise run the self-contained demo.
export const api = apiUrl ? createRemoteApi(apiUrl) : createDemoApi();
export { ApiError } from './errors';
