
const BASE = "http://localhost:5349";

export const getStatus = () => fetch(`${BASE}/status`).then(r => r.json());
export const openDay = () => fetch(`${BASE}/open-day`, { method: "POST" }).then(r => r.json());
export const closeDay = () => fetch(`${BASE}/close-day`, { method: "POST" }).then(r => r.json());
export const syncQueue = () => fetch(`${BASE}/sync`, { method: "POST" }).then(r => r.json());
