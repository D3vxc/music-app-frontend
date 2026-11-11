import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });

export function errorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || error?.message || fallback;
}

export default api;
