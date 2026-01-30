export type Product = {
    id: string;
    slug: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image: string; // Placeholder color or path
};

export const products: Product[] = [
    {
        id: "1",
        slug: "nyx-silk-mask",
        name: "Nyx Silk Mask",
        price: 85,
        description: "Pure Mulberry Silk / Obsidian. Complete optical isolation.",
        category: "Touch",
        image: "#1a1a1a",
    },
    {
        id: "2",
        slug: "ember-candle",
        name: "Ember Candle",
        price: 62,
        description: "Smoked Sandalwood & Amber. Olfactory anchor for the evening.",
        category: "Scent",
        image: "#2a2a2a",
    },
    {
        id: "3",
        slug: "nocturnal-mist",
        name: "Nocturnal Mist",
        price: 48,
        description: "Lavender & Vetiver Hydrosol. Signal to the nervous system.",
        category: "Scent",
        image: "#151515",
    },
    {
        id: "4",
        slug: "midnight-ritual-kit",
        name: "Midnight Ritual Kit",
        price: 145,
        description: "The complete collection for the dedicated sleeper.",
        category: "Kit",
        image: "#222",
    }
];

export const articles = [
    {
        id: "1",
        title: "The Architecture of Rest: A Guide to the Somnus Ritual",
        category: "Featured Ritual",
        readTime: "12 min read",
        snippet: "Discover the intersection of circadian biology and sensory design in our definitive guide.",
    },
    {
        id: "2",
        title: "The Biology of Darkness",
        category: "Science",
        readTime: "8 min read",
        snippet: "Exploring the profound impact of absolute darkness on melatonin synthesis.",
    },
    {
        id: "3",
        title: "Scent & Somatic Memory",
        category: "Ritual",
        readTime: "6 min read",
        snippet: "How olfactory signals can be programmed to trigger physiological relaxation.",
    }
];
