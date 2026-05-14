const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();

const blobServiceClient = new BlobServiceClient(
  `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  credential
);

async function uploadToBlob(file) {
  const containerClient = blobServiceClient
    .getContainerClient(process.env.BLOB_CONTAINER_NAME);

  const blobName = `${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(file.buffer, file.size, {
    blobHTTPHeaders: { blobContentType: 'application/pdf' }
  });

  return blockBlobClient.url;
}

module.exports = { uploadToBlob };
