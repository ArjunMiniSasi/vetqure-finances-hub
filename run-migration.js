// Simple script to run the invoice migration
// This will be executed in the browser console or as a temporary script

import { runInvoiceMigration } from './src/utils/migrateInvoices.js';

console.log('🚀 Starting Invoice Migration Process...');
console.log('⚠️  This will update existing invoices with stable document IDs.');
console.log('📋 Migration will only affect invoices that haven\'t been migrated yet.');

// Run the migration
runInvoiceMigration()
    .then(() => {
        console.log('🎉 Migration completed successfully!');
        console.log('✅ All existing invoices now have stable document IDs.');
        console.log('🔄 New invoices will use UUIDs as document IDs.');
        console.log('🔗 Receipts will continue to work with both old and new invoice structures.');
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        console.error('Please check the error details and try again.');
    });
