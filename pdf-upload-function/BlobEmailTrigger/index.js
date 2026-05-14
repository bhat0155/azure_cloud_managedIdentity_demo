const { SecretClient }          = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');
const sgMail                    = require('@sendgrid/mail');

const SIZE_THRESHOLD = 1 * 1024 * 1024; // 1 MB in bytes

module.exports = async function (context, myBlob) {
  const blobName = context.bindingData.name;
  const blobSize = myBlob.length;

  context.log(`Blob trigger fired: ${blobName} (${blobSize} bytes)`);

  if (blobSize <= SIZE_THRESHOLD) {
    context.log('File is under 1 MB — no email sent.');
    return;
  }

  const kvClient = new SecretClient(
    process.env.KEY_VAULT_URL,
    new DefaultAzureCredential()
  );
  const secret = await kvClient.getSecret('SendGridApiKey');
  sgMail.setApiKey(secret.value);

  const sizeMB = (blobSize / 1048576).toFixed(2);
  await sgMail.send({
    to:      'bhat0155@algonquinlive.com',
    from:    'bhat0155@algonquinlive.com',
    subject: `Large PDF Upload Alert: ${blobName}`,
    text:    `A PDF larger than 1 MB was uploaded.\n\nFile: ${blobName}\nSize: ${sizeMB} MB\n\nThis is an automated alert from your Azure PDF Upload App.`
  });

  context.log(`Alert email sent for ${blobName} (${sizeMB} MB)`);
};
