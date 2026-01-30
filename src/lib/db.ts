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
