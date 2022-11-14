import { ContainerClient, BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const credential = new StorageSharedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT ?? '', process.env.AZURE_STORAGE_KEY ?? '');

export default function (containerName: string): ContainerClient {
    return new BlobServiceClient(`https://${process.env.AZURE_STORAGE_ACCOUNT ?? ''}.blob.core.windows.net`, credential).getContainerClient(containerName);
}