const sql = require('mssql');
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

let pool;

function parseConnString(connStr) {
  const map = {};
  connStr.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim();
    map[key] = val;
  });

  const serverRaw = (map['server'] || map['data source'] || '').replace('tcp:', '');
  const [serverHost, serverPort] = serverRaw.split(',');

  const user = map['user id'] || map['userid'] || map['uid'] || map['user'];

  return {
    server:            serverHost,
    port:              parseInt(serverPort) || 1433,
    database:          map['database'] || map['initial catalog'],
    user,
    password:          map['password'] || map['pwd'],
    connectionTimeout: 90000,
    requestTimeout:    90000,
    options:           { encrypt: true, trustServerCertificate: false }
  };
}

async function getPool() {
  if (pool) return pool;

  const kvClient = new SecretClient(
    process.env.KEY_VAULT_URL,
    new DefaultAzureCredential()
  );
  const secret = await kvClient.getSecret('SqlConnectionString');
  const config = parseConnString(secret.value);
  pool = await sql.connect(config);
  return pool;
}

async function saveMetadata({ name, sizeBytes, blobUrl }) {
  const db = await getPool();
  const sizeMB = (sizeBytes / 1048576).toFixed(2);
  const label  = sizeMB >= 1 ? `${sizeMB} MB` : `${(sizeBytes / 1024).toFixed(1)} KB`;

  await db.request()
    .input('FileName',      sql.NVarChar, name)
    .input('FileSizeBytes', sql.BigInt,   sizeBytes)
    .input('FileSizeLabel', sql.NVarChar, label)
    .input('BlobUrl',       sql.NVarChar, blobUrl)
    .query(`INSERT INTO FileMetadata (FileName, FileSizeBytes, FileSizeLabel, BlobUrl)
            VALUES (@FileName, @FileSizeBytes, @FileSizeLabel, @BlobUrl)`);
}

module.exports = { saveMetadata };
