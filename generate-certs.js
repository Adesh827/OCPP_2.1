import forge from 'node-forge';
import fs from 'fs';
import path from 'path';

const CERTS_DIR = './certs';

// Ensure certs directory exists
if (!fs.existsSync(CERTS_DIR)) {
  fs.mkdirSync(CERTS_DIR);
  console.log('✅ Created certs directory\n');
}

function generateKeyPair() {
  return forge.pki.rsa.generateKeyPair(2048);
}

function createCertificate(commonName, orgUnit, keys, isCACert = false) {
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01' + Math.floor(Math.random() * 100000);
  
  const now = new Date();
  cert.validity.notBefore = now;
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: commonName },
    { name: 'countryName', value: 'IN' },
    { shortName: 'ST', value: 'Maharashtra' },
    { name: 'localityName', value: 'Mumbai' },
    { name: 'organizationName', value: 'OCPP_EV_Charging' },
    { shortName: 'OU', value: orgUnit }
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs); // Self-signed

  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: isCACert
    },
    {
      name: 'keyUsage',
      keyCertSign: isCACert,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        {type: 2, value: commonName},
        {type: 7, ip: '127.0.0.1'}
      ]
    }
  ]);

  // Self-sign certificate
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return cert;
}

function generateCertificates() {
  console.log('🔐 Generating SSL Certificates for TLS/WSS...\n');

  try {
    // 1. Generate Server Certificate
    console.log('1️⃣ Generating Server Certificate...');
    const serverKeys = generateKeyPair();
    const serverCert = createCertificate('localhost', 'Central_System', serverKeys);
    
    const serverCertPem = forge.pki.certificateToPem(serverCert);
    const serverKeyPem = forge.pki.privateKeyToPem(serverKeys.privateKey);
    
    fs.writeFileSync(path.join(CERTS_DIR, 'server-cert.pem'), serverCertPem);
    fs.writeFileSync(path.join(CERTS_DIR, 'server-key.pem'), serverKeyPem);
    console.log('   ✅ Server certificate & private key generated\n');

    // 2. Generate Client Certificate
    console.log('2️⃣ Generating Client/Charger Certificate...');
    const clientKeys = generateKeyPair();
    const clientCert = createCertificate('SIMULATOR_CP01', 'Charging_Point', clientKeys);
    
    const clientCertPem = forge.pki.certificateToPem(clientCert);
    const clientKeyPem = forge.pki.privateKeyToPem(clientKeys.privateKey);
    
    fs.writeFileSync(path.join(CERTS_DIR, 'client-cert.pem'), clientCertPem);
    fs.writeFileSync(path.join(CERTS_DIR, 'client-key.pem'), clientKeyPem);
    console.log('   ✅ Client certificate & private key generated\n');

    // 3. Generate CA Certificate
    console.log('3️⃣ Generating CA Certificate...');
    const caKeys = generateKeyPair();
    const caCert = createCertificate('OCPP_CA', 'Certificate_Authority', caKeys, true);
    
    const caCertPem = forge.pki.certificateToPem(caCert);
    const caKeyPem = forge.pki.privateKeyToPem(caKeys.privateKey);
    
    fs.writeFileSync(path.join(CERTS_DIR, 'ca-cert.pem'), caCertPem);
    fs.writeFileSync(path.join(CERTS_DIR, 'ca-key.pem'), caKeyPem);
    console.log('   ✅ CA certificate & private key generated\n');

    // Display summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ All certificates generated successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📂 Generated files in certs/ directory:');
    console.log('   ├── server-cert.pem     (Server Certificate)');
    console.log('   ├── server-key.pem      (Server Private Key)');
    console.log('   ├── client-cert.pem     (Client Certificate)');
    console.log('   ├── client-key.pem      (Client Private Key)');
    console.log('   ├── ca-cert.pem         (CA Certificate)');
    console.log('   └── ca-key.pem          (CA Private Key)\n');
    
    console.log('🔒 Security Configuration:');
    console.log('   ✓ Protocol: TLS 1.2/1.3');
    console.log('   ✓ Key Type: RSA 2048-bit');
    console.log('   ✓ Validity: 365 days');
    console.log('   ✓ Hash Algorithm: SHA-256');
    console.log('   ✓ Server Authentication: Enabled');
    console.log('   ✓ Client Authentication: Supported\n');
    
    console.log('📝 Next Steps:');
    console.log('   1. ✅ Certificates ready');
    console.log('   2. ⏭️  Update index.js for HTTPS + WSS');
    console.log('   3. ⏭️  Update simulator for WSS connection');
    console.log('   4. ⏭️  Test secure connection\n');

    console.log('🎯 Connection Comparison:');
    console.log('   ❌ Unsecured: ws://localhost:8080  (Plain Text)');
    console.log('   ✅ Secured:   wss://localhost:8443 (TLS Encrypted)\n');

    console.log('💡 For Industry Demo:');
    console.log('   → Show real-time encryption status on dashboard');
    console.log('   → Demonstrate certificate-based authentication');
    console.log('   → Highlight security compliance (TLS 1.3)\n');

  } catch (error) {
    console.error('❌ Error generating certificates:', error.message);
    console.error(error);
    process.exit(1);
  }
}

generateCertificates();
