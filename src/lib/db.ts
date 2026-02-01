import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function getProducts() {
    const filePath = path.join(DATA_DIR, 'products.json');
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

export async function getProductBySlug(slug: string) {
    const products = await getProducts();
    return products.find((p: any) => p.slug === slug);
}

export async function saveProduct(product: any) {
    const products = await getProducts();
    const index = products.findIndex((p: any) => p.id === product.id);

    if (index >= 0) {
        products[index] = product;
    } else {
        products.push(product);
    }

    await fs.writeFile(path.join(DATA_DIR, 'products.json'), JSON.stringify(products, null, 2));
}

export async function getArticles() {
    const filePath = path.join(DATA_DIR, 'articles.json');
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

export async function saveArticle(article: any) {
    const articles = await getArticles();
    const index = articles.findIndex((a: any) => a.id === article.id);

    if (index >= 0) {
        articles[index] = article;
    } else {
        articles.push(article);
    }

    await fs.writeFile(path.join(DATA_DIR, 'articles.json'), JSON.stringify(articles, null, 2));
}

export async function getHomeLayout() {
    const filePath = path.join(DATA_DIR, 'home.json');
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return { sections: [] };
    }
}


export async function saveHomeLayout(layout: any) {
    await fs.writeFile(path.join(DATA_DIR, 'home.json'), JSON.stringify(layout, null, 2));
}

// ==========================================
// 🛍️ Order Management
// ==========================================
export async function getOrders() {
    const filePath = path.join(DATA_DIR, 'orders.json');
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

export async function saveOrder(order: any) {
    const orders = await getOrders();
    // Check if order exists (update) or push new
    const index = orders.findIndex((o: any) => o.id === order.id);
    if (index >= 0) {
        orders[index] = order;
    } else {
        orders.push(order);
    }
    await fs.writeFile(path.join(DATA_DIR, 'orders.json'), JSON.stringify(orders, null, 2));
}

// ==========================================
// 👥 User Management
// ==========================================
export async function getUsers() {
    const filePath = path.join(DATA_DIR, 'users.json');
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

export async function saveUser(user: any) {
    const users = await getUsers();
    const index = users.findIndex((u: any) => u.id === user.id);
    if (index >= 0) {
        users[index] = user;
    } else {
        users.push(user);
    }
    await fs.writeFile(path.join(DATA_DIR, 'users.json'), JSON.stringify(users, null, 2));
}

// ==========================================
// 📊 Analytics (Simple Persistent Store)
// ==========================================
export async function getAnalytics() {
    const filePath = path.join(DATA_DIR, 'analytics.json');
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return { totalVisitors: 0, dailyVisits: {} };
    }
}

export async function updateAnalytics(data: any) {
    const current = await getAnalytics();
    const updated = { ...current, ...data };
    await fs.writeFile(path.join(DATA_DIR, 'analytics.json'), JSON.stringify(updated, null, 2));
}
