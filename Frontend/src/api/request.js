/**
 * Wraps an axios call into a consistent { data, error } shape, so
 * components never need try/catch — they just check result.error.
 * On failure, data is null and error is a human-readable message
 * (pulled from FastAPI's `detail` field when present).
 *
 * Shared by every file in src/handlers/ — this is the single place
 * this logic lives, so all handlers behave identically on failure.
 */
export async function request(promise) {
  try {
    const response = await promise;
    return { data: response.data, error: null };
  } catch (err) {
    const message =
      err.response?.data?.detail || err.message || "Something went wrong";
    return { data: null, error: message };
  }
}
