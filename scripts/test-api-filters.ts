interface Product {
    id: string;
    name: string;
    isActive: boolean;
}

interface ApiResponse {
    products: Product[];
    total: number;
}

async function testProductFiltering() {
    console.log('--- Probando API de Productos ---');

    // 1. Get default (only active)
    const activeRes = await fetch('http://localhost:3001/api/products');
    const activeData = (await activeRes.json()) as ApiResponse;
    console.log('Default (Active) count:', activeData.products.length);
    activeData.products.forEach((p: Product) => {
        if (!p.isActive) console.error('BUG: Found inactive product in default view!', p.name);
    });

    // 2. Get all (including inactive)
    const allRes = await fetch('http://localhost:3001/api/products?all=true');
    const allData = (await allRes.json()) as ApiResponse;
    console.log('Show All (Including inactive) count:', allData.products.length);

    const inactive = allData.products.filter((p: Product) => !p.isActive);
    console.log('Inactive products found:', inactive.length);
    inactive.forEach((p: Product) => console.log(' - Inactive:', p.name));
}

testProductFiltering().catch(console.error);
