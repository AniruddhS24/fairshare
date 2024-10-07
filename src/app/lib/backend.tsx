
const BACKEND_URL = 'http://localhost:3000';

let dummy = [
    {name: 'Item 1', qty: 1, price: 5},
    {name: 'Item 2', qty: 2, price: 6},
    {name: 'Item 3', qty: 3, price: 0.5},
    {name: 'Item 4', qty: 1, price: 2.5},
    {name: 'Item 5', qty: 1, price: 10}];

export function fetchDummyData() {
    return dummy;
}

export function setDummyData(data) {
    dummy = data;
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