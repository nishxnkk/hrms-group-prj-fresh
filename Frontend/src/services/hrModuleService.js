const API_BASE = `${import.meta.env.VITE_API_BASE || "http://localhost:3000"}/api/hr-modules`;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const fetchHrRecords = async (moduleKey) => {
  const res = await fetch(`${API_BASE}/${moduleKey}`, { headers: authHeaders() });
  return parseJson(res);
};

export const createHrRecord = async (moduleKey, payload) => {
  const res = await fetch(`${API_BASE}/${moduleKey}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const updateHrRecord = async (moduleKey, id, payload) => {
  const res = await fetch(`${API_BASE}/${moduleKey}/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const deleteHrRecord = async (moduleKey, id) => {
  const res = await fetch(`${API_BASE}/${moduleKey}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parseJson(res);
};

export const fetchHrSummary = async () => {
  const res = await fetch(`${API_BASE}/summary`, { headers: authHeaders() });
  return parseJson(res);
};
