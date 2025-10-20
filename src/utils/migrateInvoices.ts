// Migration script for existing invoices
// Run this once to migrate existing invoices to the new stable ID system

import { migrateExistingInvoices } from '@/services/firestoreService';

export const runInvoiceMigration = async () => {
    try {
        console.log('🚀 Starting invoice migration...');
        console.log('This will add stable document IDs to existing invoices.');
        console.log('⚠️  Make sure to backup your data before running this migration.');

        // Uncomment the line below to run the migration
        await migrateExistingInvoices();

        console.log('✅ Migration completed successfully!');
        console.log('📝 All existing invoices now have stable document IDs.');
        console.log('🔄 New invoices will use UUIDs as document IDs.');
        console.log('🔗 Receipts will continue to work with both old and new invoice structures.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};

// Instructions for running the migration:
// 1. Uncomment the migration line above
// 2. Run this function once in your application
// 3. Comment the migration line back to prevent accidental re-runs
// 4. The migration is safe to run multiple times (it only migrates unmigrated invoices)
