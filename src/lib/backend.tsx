const apiUrl = "https://ztzl10kljk.execute-api.us-east-1.amazonaws.com/prod";

export async function backend(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body: unknown = null
): Promise<unknown> {
  const token = localStorage.getItem("jwt");
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: method,
      body: method == "GET" ? null : JSON.stringify(body),
      headers: token
        ? {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        : {
            "Content-Type": "application/json",
          },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Request failed");
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.log(method);
    console.error("There was a problem!", error);
    throw error; // Rethrow the error for further handling
  }
}
