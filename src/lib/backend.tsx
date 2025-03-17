const apiUrl = "https://67slbfhmid.execute-api.us-east-1.amazonaws.com/prod";

export async function backend<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body: unknown = null
): Promise<T> {
  // TODO: Store token in context instead of fetching from localStorage??
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
      console.log(errorData);
      throw new Error(errorData.error || "Request failed");
    }
    const response_body = await response.json();
    if ("message" in response_body) {
      //console.log(response_body.message);
    }
    if ("data" in response_body) {
      return response_body.data;
    }
    // console.log(response_body);
    return response_body;
  } catch (error) {
    // console.log(method);
    console.error("There was a problem!", error);
    throw error; // Rethrow the error for further handling
  }
}

// Receipts
export interface Receipt {
  id: string;
  image_url: string;
  shared_cost: string;
  grand_total: string;
  addl_gratuity: string;
  settled: boolean;
  item_counter: number;
  consumers: number;
}

export async function createEmptyReceipt(): Promise<Receipt> {
  return await backend("POST", `/receipt`, {});
}

export async function getReceipt(receipt_id: string): Promise<Receipt> {
  return await backend("GET", `/receipt/${receipt_id}`);
}

export async function updateReceipt(
  receipt_id: string,
  shared_cost: string,
  grand_total: string
): Promise<Receipt> {
  return await backend("PUT", `/receipt/${receipt_id}`, {
    shared_cost,
    grand_total,
  });
}

export async function setReceiptConsumers(
  receipt_id: string,
  consumers: number
): Promise<Receipt> {
  return await backend("PUT", `/receipt/${receipt_id}`, {
    consumers,
  });
}

export async function markAsSettled(receipt_id: string): Promise<Receipt> {
  return await backend("PUT", `/receipt/${receipt_id}`, {
    settled: true,
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
  split_counter?: number;
  global_split: boolean;
}

export async function getItems(receipt_id: string): Promise<Item[]> {
  return await backend("GET", `/receipt/${receipt_id}/item`);
}

export async function createItem(
  receipt_id: string,
  name: string,
  quantity: string,
  price: string,
  global_split: boolean
): Promise<Item> {
  return await backend("POST", `/receipt/${receipt_id}/item`, {
    name,
    quantity,
    price,
    global_split,
  });
}

export async function updateItem(
  receipt_id: string,
  item_id: string,
  name: string,
  quantity: string,
  price: string,
  global_split: boolean
): Promise<Item> {
  return await backend("PUT", `/receipt/${receipt_id}/item/${item_id}`, {
    name,
    quantity,
    price,
    global_split,
  });
}

export async function markGloballySplitItem(
  receipt_id: string,
  item_id: string,
  global_split: boolean
): Promise<Item> {
  return await backend("PUT", `/receipt/${receipt_id}/item/${item_id}`, {
    global_split,
  });
}

export async function deleteItem(
  receipt_id: string,
  item_id: string
): Promise<void> {
  return await backend("DELETE", `/receipt/${receipt_id}/item/${item_id}`);
}

// Splits
export interface Split {
  id: string;
  receipt_id: string;
  item_id: string;
  user_id: string;
  split_id: string;
}

export async function getSplits(receipt_id: string): Promise<Split[]> {
  return await backend("GET", `/receipt/${receipt_id}/split`);
}

export async function getMySplits(receipt_id: string): Promise<Split[]> {
  return await backend("GET", `/receipt/${receipt_id}/split?only_mine=true`);
}

export async function getNewSplitID(
  receipt_id: string,
  item_id: string
): Promise<number> {
  return await backend(
    "POST",
    `/receipt/${receipt_id}/item/${item_id}/increment_split`,
    {}
  );
}

export async function createSplit(
  receipt_id: string,
  item_id: string,
  split_id: string
): Promise<Split> {
  return await backend("POST", `/receipt/${receipt_id}/split`, {
    receipt_id,
    item_id,
    split_id,
  });
}

export async function deleteSplit(
  receipt_id: string,
  split_key: string
): Promise<void> {
  return await backend("DELETE", `/receipt/${receipt_id}/split/${split_key}`);
}

// Users/Roles
export interface User {
  id: string;
  name: string;
  phone: string;
  venmo_handle: string;
}

export interface Role {
  receipt_id: string;
  user_id: string;
  permission: string;
  done: boolean;
}

export async function createOTP(phone: string): Promise<{ otp: string }> {
  return await backend("POST", `/otp_generate`, { phone });
}

// TODO: don't need to return promises
export async function verifyOTP(
  phone: string,
  otp: number
): Promise<{ user_exists: boolean; message: string }> {
  return await backend("POST", `/otp_verify`, { phone, otp });
}

export async function getUserRole(receipt_id: string): Promise<Role> {
  return await backend("GET", `/receipt/${receipt_id}/role`);
}

export async function createRole(
  receipt_id: string,
  role: string
): Promise<Role> {
  return await backend("POST", `/receipt/${receipt_id}/role`, { role });
}

export async function markRoleDone(
  receipt_id: string,
  done: boolean
): Promise<Role> {
  return await backend("PUT", `/receipt/${receipt_id}/role`, { done });
}

export async function createJWTToken(
  name: string,
  phone: string,
  venmo_handle: string
): Promise<{ token: string }> {
  return await backend("POST", "/token", { name, phone, venmo_handle });
}

export async function getUserFromJWT(): Promise<User> {
  return await backend("GET", "/token");
}

export async function getParticipants(
  receipt_id: string
): Promise<{ hosts: User[]; consumers: User[] }> {
  return await backend("GET", `/receipt/${receipt_id}/participants`);
}
