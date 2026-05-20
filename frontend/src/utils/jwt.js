export function parseJwt(token) {
  if (!token) {
    return {};
  }

  const payload = token.split('.')[1];
  if (!payload) {
    return {};
  }

  try {
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return {};
  }
}
