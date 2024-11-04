
const BACKEND_URL = 'http://localhost:3000';

let ct = 6;

let receipts = [
    {id: 0, items: [0, 1, 2, 3, 4], imageUrl: "XXX", hostId: 0, sharedCost: 4.0, numConsumers: 2}
]

let items = [
    {id: 0, name: 'Pad Thai', quantity: 1, price: 5, receiptId: 0},
    {id: 1, name: 'Fried Rice', quantity: 2, price: 6, receiptId: 0},
    {id: 2, name: 'Margarita', quantity: 3, price: 0.5, receiptId: 0},
    {id: 3, name: 'Mochi Ice Cream', quantity: 1, price: 2.5, receiptId: 0},
    {id: 4, name: 'Pad See Ew', quantity: 1, price: 10, receiptId: 0}];

let users = [
    {id: 0, name: "User A", phone: "1234567890", venmo: "@userA", isVerified: false},
    {id: 1, name: "User B", phone: "1234567890", venmo: "@userB", isVerified: false}
]

let splits = [
    {id: 0, userId: 0, quantity: 1, split: 1, itemId: 0, receiptId: 0},
    {id: 1, userId: 0, quantity: 1, split: 2, itemId: 4, receiptId: 0},
    {id: 2, userId: 1, quantity: 1, split: 2, itemId: 4, receiptId: 0},
    {id: 3, userId: 0, quantity: 1, split: 1, itemId: 1, receiptId: 0},
    {id: 4, userId: 1, quantity: 1, split: 1, itemId: 1, receiptId: 0},
    {id: 5, userId: 0, quantity: 2, split: 1, itemId: 2, receiptId: 0},
    {id: 6, userId: 1, quantity: 1, split: 1, itemId: 2, receiptId: 0},
    {id: 7, userId: 0, quantity: 1, split: 1, itemId: 3, receiptId: 0},
]

export function dummyGetReceipt(receiptId: number) {
    return receipts.find((item) => item.id == receiptId)
}

export function dummyGetReceiptItems(receiptId: number) {
    return items.filter((item) => item.receiptId == receiptId)
}

export function dummyGetUsers() {
    return users;
}

export function dummyGetReceiptSplits(receiptId: number) {
    return splits.filter((item) => item.receiptId == receiptId)
}

export function dummySetReceiptItems(receiptId: number, newItems) {
    const filteredItems = [];
    for(const item of items)
        if(item.receiptId != receiptId)
            filteredItems.push(item);
    for(const item of newItems) {
        if ("id" in item) {
            filteredItems.push(item);
        } else {
            filteredItems.push({id: ct, ...item});
            ct++;
        }
    }
    items = filteredItems;
}

export function dummySetSplit(userId: number, itemId: number, quantity: number, split: number) {
    const filteredSplits = [];
    for(const item of splits)
        if(item.itemId != itemId || item.userId != userId)
            filteredSplits.push(item);
    const item = splits.find((item) => item.itemId == itemId && item.userId == userId);
    if(item == undefined)
        return;
    item.quantity = quantity;
    item.split = split;
    splits = [...filteredSplits, item];
}

function addJWTHeader(headers: Headers) {
    const jwt = localStorage.getItem('jwt');
    headers.append('Authorization', `Bearer ${jwt}`);
}

export function fetchData(path: string, method: string, data: any) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    addJWTHeader(headers);
    if (method === 'GET') {
        return fetch(`${BACKEND_URL}${path}`, {
            method,
            headers,
        }).then((response) => response.json());
    }
    return fetch(`${BACKEND_URL}${path}`, {
        method,
        headers,
        body: JSON.stringify(data),
    }).then((response) => response.json());
}