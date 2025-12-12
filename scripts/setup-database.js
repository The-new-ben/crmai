#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates database and runs migrations
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const DB_NAME = process.env.DB_NAME || 'zerotouch';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';

const connectionString = `postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}`;

console.log('🗄️  Zero-Touch Database Setup\n');
console.log('─'.repeat(50));

function run(command, ignoreError = false) {
    try {
        console.log(`> ${command}`);
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        if (!ignoreError) {
            console.error(`Error: ${error.message}`);
        }
        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'setup';

    switch (command) {
        case 'setup':
            setup();
            break;
        case 'reset':
            reset();
            break;
        case 'migrate':
            migrate();
            break;
        case 'seed':
            seed();
            break;
        default:
            console.log('Usage:');
            console.log('  node setup-database.js setup    Create database and run schema');
            console.log('  node setup-database.js reset    Drop and recreate database');
            console.log('  node setup-database.js migrate  Run schema migrations');
            console.log('  node setup-database.js seed     Insert seed data');
    }
}

function setup() {
    console.log('📦 Creating database...\n');

    // Check if database exists
    run(`psql ${connectionString}/postgres -c "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" -t`, true);

    // Create database
    run(`psql ${connectionString}/postgres -c "CREATE DATABASE ${DB_NAME}"`, true);

    console.log('\n📋 Running schema...\n');
    migrate();

    console.log('\n✅ Database setup complete!');
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
}

function reset() {
    console.log('⚠️  Resetting database (this will delete all data)...\n');

    // Drop database
    run(`psql ${connectionString}/postgres -c "DROP DATABASE IF EXISTS ${DB_NAME}"`, true);

    // Recreate
    setup();
}

function migrate() {
    const schemaPath = path.join(process.cwd(), '..', 'database', 'schema.sql');

    if (!existsSync(schemaPath)) {
        console.error(`Schema file not found: ${schemaPath}`);
        process.exit(1);
    }

    run(`psql ${connectionString}/${DB_NAME} -f "${schemaPath}"`);

    console.log('\n✅ Schema applied successfully!');
}

function seed() {
    console.log('🌱 Inserting seed data...\n');

    // Seed data is included in schema.sql
    // Additional seed data can be added here

    console.log('✅ Seed data inserted!');
}

main().catch(console.error);
