import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';

const credential = new AzureNamedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT ?? '', process.env.AZURE_STORAGE_KEY ?? '');

export default function (tableName: string): TableClient {
    return new TableClient(`https://${process.env.AZURE_STORAGE_ACCOUNT ?? ''}.table.core.windows.net`, tableName, credential);
}