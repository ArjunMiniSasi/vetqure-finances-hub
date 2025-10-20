import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { migrateExistingInvoices, migrateExistingCustomers } from '@/services/firestoreService';
import { toast } from 'sonner';

export const MigrationRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  const [migratedCount, setMigratedCount] = useState<number>(0);
  const [customerMigratedCount, setCustomerMigratedCount] = useState<number>(0);

  const runMigration = async () => {
    setIsRunning(true);
    setMigrationStatus('Starting migration...');
    
    try {
      console.log('🚀 Starting migrations...');
      
      // First, migrate customers for case-insensitive search
      setMigrationStatus('Migrating customers for case-insensitive search...');
      await migrateExistingCustomers();
      setCustomerMigratedCount(1); // Simplified for UI
      
      // Then migrate invoices
      setMigrationStatus('Migrating invoices for stable IDs...');
      
      // Get all existing invoices first to count them
      const { getAllInvoices } = await import('@/services/firestoreService');
      const existingInvoices = await getAllInvoices();
      
      setMigrationStatus(`Found ${existingInvoices.length} invoices to check...`);
      
      let migratedCount = 0;
      
      for (const invoice of existingInvoices) {
        // Check if invoice already has stable ID structure
        if (!invoice.document_id && invoice.invoice_id) {
          // This is an old invoice that needs migration
          const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
          const { db } = await import('@/config/firebase');
          
          const invoiceRef = doc(db, 'customer_invoices', invoice.invoice_id);
          
          await updateDoc(invoiceRef, {
            document_id: invoice.invoice_id, // Use existing invoice_id as stable ID
            invoice_number: invoice.invoice_id, // Add new field
            original_invoice_number: invoice.invoice_id, // First invoice number
            version: 1, // First version
            is_latest: true, // This is the latest version
            updatedAt: Timestamp.now()
          });
          
          migratedCount++;
          setMigrationStatus(`Migrated ${migratedCount} invoices...`);
          console.log(`Migrated invoice: ${invoice.invoice_id}`);
        }
      }
      
      setMigratedCount(migratedCount);
      setMigrationStatus(`Migration completed! Migrated ${migratedCount} invoices and enabled case-insensitive customer search.`);
      toast.success(`Migration completed! Migrated ${migratedCount} invoices and enabled case-insensitive customer search.`);
      
      console.log(`Migration completed. Migrated ${migratedCount} invoices.`);
      
    } catch (error) {
      console.error('Error during invoice migration:', error);
      setMigrationStatus(`Migration failed: ${error}`);
      toast.error(`Migration failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Invoice Migration Tool</CardTitle>
        <CardDescription>
          Migrate existing data to use stable document IDs and enable case-insensitive search. 
          This ensures that invoice edits won't break relationships and customer search works regardless of case.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>⚠️ Important:</strong> This migration is safe to run multiple times. 
            It will only migrate invoices that haven't been migrated yet. 
            Make sure you have a backup of your data before proceeding.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Button 
            onClick={runMigration} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Migration...' : 'Run Migration'}
          </Button>
          
          {migrationStatus && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">{migrationStatus}</p>
            </div>
          )}
          
          {(migratedCount > 0 || customerMigratedCount > 0) && (
            <Alert>
              <AlertDescription>
                ✅ <strong>Migration Successful!</strong> 
                {migratedCount > 0 && ` ${migratedCount} invoices have been migrated to use stable document IDs.`}
                {customerMigratedCount > 0 && ` Customer search is now case-insensitive.`}
                Your system is now future-proof and user-friendly!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
