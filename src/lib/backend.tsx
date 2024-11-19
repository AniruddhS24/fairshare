const apiUrl = "https://ztzl10kljk.execute-api.us-east-1.amazonaws.com/prod";

export async function backend<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body: unknown = null
): Promise<T> {
  console.log(method, endpoint, body);
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
      throw new Error(errorData.error || "Request failed");
    }
    const response_body = await response.json();
    if ("message" in response_body) {
      //console.log(response_body.message);
    }
    if ("data" in response_body) {
      return response_body.data;
    }
    console.log(response_body);
    return response_body;
  } catch (error) {
    console.log(method);
    console.error("There was a problem!", error);
    throw error; // Rethrow the error for further handling
  }
}

// Receipts
interface Receipt {
  id: string;
  image_url: string;
  shared_cost: string;
  grand_total: string;
}

export async function getReceipt(receiptid: string): Promise<Receipt> {
  return await backend("GET", `/receipt/${receiptid}`);
}

export async function updateReceipt(
  receiptid: string,
  shared_cost: string,
  grand_total: string
): Promise<Receipt> {
  return await backend("PUT", `/receipt/${receiptid}`, {
    shared_cost,
    grand_total,
  });
}

export async function runOCR(key: string): Promise<{ message: string }> {
  return await backend("POST", "/ocr", { key });
}

export async function getUploadLink(): Promise<{
  presigned_url: {
    url: string;
    fields: { [key: string]: string };
  };
  file_url: string;
}> {
  return await backend("GET", "/upload");
}

// Items
export interface Item {
  id: string;
  name: string;
  price: string;
  quantity: string;
  receipt_id: string;
}

export async function getItems(receiptid: string): Promise<Item[]> {
  return await backend("GET", `/receipt/${receiptid}/item`);
}

export async function createItem(
  receiptid: string,
  name: string,
  quantity: string,
  price: string
): Promise<Item> {
  return await backend("POST", `/receipt/${receiptid}/item`, {
    name,
    quantity,
    price,
  });
}

export async function updateItem(
  receiptid: string,
  item_id: string,
  name: string,
  quantity: string,
  price: string
): Promise<Item> {
  return await backend("PUT", `/receipt/${receiptid}/item/${item_id}`, {
    name,
    quantity,
    price,
  });
}

export async function deleteItem(
  receiptid: string,
  item_id: string
): Promise<void> {
  return await backend("DELETE", `/receipt/${receiptid}/item/${item_id}`);
}

// Splits
interface Split {
  id: string;
  receipt_id: string;
  item_id: string;
  user_id: string;
  quantity: string;
  split: string;
}

export async function getSplits(receiptid: string): Promise<Split[]> {
  return await backend("GET", `/receipt/${receiptid}/split`);
}

export async function createSplit(
  receiptid: string,
  quantity: string,
  split: string,
  item_id: string
): Promise<Split> {
  return await backend("POST", `/receipt/${receiptid}/split`, {
    quantity,
    split,
    item_id,
  });
}

// Users/Roles
export interface User {
  id: string;
  name: string;
  phone: string;
}

interface Role {
  id: string;
  receipt_id: string;
  user_id: string;
  role: string;
}

export async function getUserRole(receiptid: string): Promise<Role> {
  return await backend("GET", `/receipt/${receiptid}/role`);
}

export async function createRole(
  receiptid: string,
  role: string
): Promise<Role> {
  return await backend("POST", `/receipt/${receiptid}/role`, { role });
}

export async function createJWTToken(
  name: string,
  phone: string
): Promise<{ token: string }> {
  return await backend("POST", "/token", { name, phone });
}

export async function getUserFromJWT(): Promise<User> {
  return await backend("GET", "/token");
}

export async function getParticipants(
  receiptid: string
): Promise<{ hosts: User[]; consumers: User[] }> {
  return await backend("GET", `/receipt/${receiptid}/participants`);
}
