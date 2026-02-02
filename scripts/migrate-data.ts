/**
 * Data Migration Script
 * 
 * This script migrates existing JSON data to Supabase
 * Run this AFTER creating the Supabase project and applying the schema migration
 * 
 * Usage:
 * 1. Set environment variables in .env.local
 * 2. Run: npm run migrate-data
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Database } from '../src/types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Helper function to read JSON files
function readJSONFile(filename: string): any {
    try {
        const filePath = join(process.cwd(), 'data', filename);
        const fileContent = readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.warn(`⚠️  Could not read ${filename}, skipping...`);
        return [];
    }
}

async function migrateProducts() {
    console.log('📦 Migrating products...');
    const products = readJSONFile('products.json');

    if (!products || products.length === 0) {
        console.log('   No products to migrate');
        return;
    }

    const { data, error } = await supabase
        .from('products')
        .upsert(products, { onConflict: 'id' });

    if (error) {
        console.error('   ❌ Error:', error.message);
    } else {
        console.log(`   ✅ Migrated ${products.length} products`);
    }
}

async function migrateOrders() {
    console.log('🛒 Migrating orders...');
    const orders = readJSONFile('orders.json');

    if (!orders || orders.length === 0) {
        console.log('   No orders to migrate');
        return;
    }

    const { data, error } = await supabase
        .from('orders')
        .upsert(orders, { onConflict: 'id' });

    if (error) {
        console.error('   ❌ Error:', error.message);
    } else {
        console.log(`   ✅ Migrated ${orders.length} orders`);
    }
}

async function migrateArticles() {
    console.log('📝 Migrating articles...');
    const articles = readJSONFile('articles.json');

    if (!articles || articles.length === 0) {
        console.log('   No articles to migrate');
        return;
    }

    const { data, error } = await supabase
        .from('articles')
        .upsert(articles, { onConflict: 'id' });

    if (error) {
        console.error('   ❌ Error:', error.message);
    } else {
        console.log(`   ✅ Migrated ${articles.length} articles`);
    }
}

async function migrateTickets() {
    console.log('🎫 Migrating tickets...');
    const tickets = readJSONFile('tickets.json');

    if (!tickets || tickets.length === 0) {
        console.log('   No tickets to migrate');
        return;
    }

    const { data, error } = await supabase
        .from('tickets')
        .upsert(tickets, { onConflict: 'id' });

    if (error) {
        console.error('   ❌ Error:', error.message);
    } else {
        console.log(`   ✅ Migrated ${tickets.length} tickets`);
    }
}

async function migrateHomeLayout() {
    console.log('🏠 Migrating homepage layout...');
    const homeData = readJSONFile('home.json');

    if (!homeData || !homeData.sections) {
        console.log('   No homepage data to migrate');
        return;
    }

    // @ts-ignore - Type inference issue with Supabase generated types
    const { data, error } = await supabase
        .from('homepage_layout')
        .upsert({
            id: 1,
            sections: homeData.sections as any
        } as any, { onConflict: 'id' });

    if (error) {
        console.error('   ❌ Error:', error.message);
    } else {
        console.log('   ✅ Migrated homepage layout');
    }
}

async function migrateAnalytics() {
    console.log('📊 Migrating analytics...');
    const analyticsData = readJSONFile('analytics.json');

    if (!analyticsData) {
        console.log('   No analytics data to migrate');
        return;
    }

    // @ts-ignore - Type inference issue with Supabase generated types
    const { data, error } = await supabase
        .from('analytics')
        .upsert({
            id: 1,
            total_visitors: analyticsData.totalVisitors || 0,
            daily_visits: analyticsData.dailyVisits || {}
        } as any, { onConflict: 'id' });

    if (error) {
        console.error('   ❌ Error:', error.message);
    } else {
        console.log('   ✅ Migrated analytics');
    }
}

// Main migration function
async function main() {
    console.log('🚀 Starting data migration to Supabase...\n');

    try {
        await migrateProducts();
        await migrateOrders();
        await migrateArticles();
        await migrateTickets();
        await migrateHomeLayout();
        await migrateAnalytics();

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Verify data in Supabase Dashboard');
        console.log('2. Update .env.local with your Supabase credentials');
        console.log('3. Test the application locally');
        console.log('4. Deploy to production\n');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

main();
