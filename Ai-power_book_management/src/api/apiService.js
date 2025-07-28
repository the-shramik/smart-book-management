// src/api/apiService.js
import { baseUrl } from "./config";

export async function fetchApi(endUrl, options = {}) {
  const url = `${baseUrl}${endUrl}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error("Network error");
    return await res.json();
  } catch (err) {
    throw err;
  }
}
