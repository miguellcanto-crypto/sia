async function testSearch() {
    const queries = ['camaron', 'ca'];
    for (const q of queries) {
        console.log(`Testing search for: ${q}`);
        try {
            const res = await fetch(`http://localhost:3000/api/products/search?q=${q}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`Success! Found ${data.length} products.`);
            } else {
                console.error(`Error: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Fetch failed: ${error.message}`);
            } else {
                console.error('An unknown error occurred:', error);
            }
        }
    }
}

testSearch();
