// Export utility functions for CSV/Excel exports

interface ExportColumn {
  header: string;
  accessor: string | ((row: any) => string);
}

export const exportToCSV = (
  data: any[],
  columns: ExportColumn[],
  filename: string
): void => {
  if (!data.length) {
    console.warn('No data to export');
    return;
  }

  // Generate headers
  const headers = columns.map(col => `"${col.header}"`).join(',');

  // Generate rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value: any;
      if (typeof col.accessor === 'function') {
        value = col.accessor(row);
      } else {
        value = row[col.accessor] ?? '';
      }
      // Escape quotes and wrap in quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  }).join('\n');

  const csvContent = `\ufeff${headers}\n${rows}`; // BOM for UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export company requests
export const exportCompanyRequests = (requests: any[]): void => {
  const columns: ExportColumn[] = [
    { header: 'N° Suivi', accessor: 'tracking_number' },
    { header: 'Type', accessor: (r) => r.structure_type?.toUpperCase() || '' },
    { header: 'Nom Entreprise', accessor: 'company_name' },
    { header: 'Contact', accessor: 'contact_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Téléphone', accessor: 'phone' },
    { header: 'Région', accessor: 'region' },
    { header: 'Ville', accessor: 'city' },
    { header: 'Capital', accessor: 'capital' },
    { header: 'Prix Estimé', accessor: (r) => r.estimated_price?.toLocaleString() || '0' },
    { header: 'Statut Paiement', accessor: 'payment_status' },
    { header: 'Statut', accessor: 'status' },
    { header: 'Date Création', accessor: (r) => new Date(r.created_at).toLocaleDateString('fr-FR') },
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(requests, columns, `demandes-creation-${date}`);
};

// Export service requests
export const exportServiceRequests = (requests: any[]): void => {
  const columns: ExportColumn[] = [
    { header: 'N° Suivi', accessor: 'tracking_number' },
    { header: 'Type Service', accessor: 'service_type' },
    { header: 'Catégorie', accessor: 'service_category' },
    { header: 'Entreprise', accessor: 'company_name' },
    { header: 'Contact', accessor: 'contact_name' },
    { header: 'Email', accessor: 'contact_email' },
    { header: 'Téléphone', accessor: 'contact_phone' },
    { header: 'Description', accessor: 'description' },
    { header: 'Prix Estimé', accessor: (r) => r.estimated_price?.toLocaleString() || '0' },
    { header: 'Statut Paiement', accessor: 'payment_status' },
    { header: 'Statut', accessor: 'status' },
    { header: 'Date Création', accessor: (r) => new Date(r.created_at).toLocaleDateString('fr-FR') },
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(requests, columns, `demandes-services-${date}`);
};

// Alias for AdditionalServicesAdmin
export const exportServiceRequestsToCSV = exportServiceRequests;

// Export payments
export const exportPayments = (payments: any[]): void => {
  const columns: ExportColumn[] = [
    { header: 'ID Transaction', accessor: 'transaction_id' },
    { header: 'N° Suivi', accessor: 'tracking_number' },
    { header: 'Client', accessor: 'customer_name' },
    { header: 'Email', accessor: 'customer_email' },
    { header: 'Téléphone', accessor: 'customer_phone' },
    { header: 'Montant', accessor: (r) => r.amount?.toLocaleString() || '0' },
    { header: 'Devise', accessor: 'currency' },
    { header: 'Méthode', accessor: 'payment_method' },
    { header: 'Type Demande', accessor: 'request_type' },
    { header: 'Statut', accessor: 'status' },
    { header: 'Date', accessor: (r) => new Date(r.created_at).toLocaleDateString('fr-FR') },
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(payments, columns, `paiements-${date}`);
};

// Alias for PaymentsDashboard
export const exportPaymentsToCSV = exportPayments;

// Export clients (profiles)
export const exportClients = (clients: any[]): void => {
  const columns: ExportColumn[] = [
    { header: 'Nom Complet', accessor: 'full_name' },
    { header: 'Téléphone', accessor: 'phone' },
    { header: 'Date Inscription', accessor: (r) => new Date(r.created_at).toLocaleDateString('fr-FR') },
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(clients, columns, `clients-${date}`);
};

// Export all data summary
export const exportAllData = async (
  companyRequests: any[],
  serviceRequests: any[],
  payments: any[]
): Promise<void> => {
  exportCompanyRequests(companyRequests);
  
  setTimeout(() => {
    exportServiceRequests(serviceRequests);
  }, 500);
  
  setTimeout(() => {
    exportPayments(payments);
  }, 1000);
};
