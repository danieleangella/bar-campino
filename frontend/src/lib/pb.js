const BASE_URL = 'http://127.0.0.1:8090';

export async function getEvents() {
  const res = await fetch(
    `${BASE_URL}/api/collections/events/records?filter=published%3Dtrue&sort=%2Bdate`
  );
  const data = await res.json();
  return data.items ?? [];
}