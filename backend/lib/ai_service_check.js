const response = await fetch("http://localhost:8000/search", {
    method: 'POST',
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        query: "bag",
        max_price: 100
    }),
});

const data = await response.json();
console.log(data);