const BASE = "http://localhost:5349";


export const openDay = async () => {
  const res = await fetch(`${BASE}/open-day`, { method: "POST" });
  return res.json();
};

export const closeDay = async () => {
  const res = await fetch(`${BASE}/close-day`, { method: "POST" });
  return res.json();
};

export const syncQueue = async () => {
  const res = await fetch(`${BASE}/sync`, { method: "POST" });
  return res.json();
};
export const getQueue = async () => {
  const res = await fetch(`${BASE}/queue`);
  return res.json();
};


export async function getStatus() {
  const res = await fetch("http://localhost:5349/status");
  if (!res.ok) throw new Error("Failed to fetch system status");
  return await res.json();
}

export async function getConfig() {
  const res = await fetch("http://localhost:5349/get-config");
  if (!res.ok) throw new Error("Failed to fetch config");
  return await res.json();
}
