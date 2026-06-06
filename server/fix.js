const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 QuickBill Auto-Fix Starting...\n');

// Check if we're in the right folder
if (!fs.existsSync('server.js')) {
  console.log('❌ ERROR: Run this from the /server folder!');
  console.log('   Type: cd quickbill/server');
  console.log('   Then: node fix.js');
  process.exit(1);
}

// Step 1: Check package.json
console.log('✅ Step 1: Checking package.json...');
if (!fs.existsSync('package.json')) {
  console.log('❌ package.json missing! Creating...');
  fs.writeFileSync('package.json', JSON.stringify({
    "name": "quickbill-server",
    "version": "1.0.0",
    "scripts": { "start": "node server.js", "dev": "nodemon server.js" },
    "dependencies": {
      "express": "^4.18.2",
      "mongoose": "^8.0.0",
      "cors": "^2.8.5",
      "dotenv": "^16.3.0",
      "bcryptjs": "^2.4.3",
      "jsonwebtoken": "^9.0.0",
      "puppeteer": "^21.0.0",
      "nodemailer": "^6.9.0",
      "stripe": "^14.0.0"
    },
    "devDependencies": {
      "nodemon": "^3.0.0"
    }
  }, null, 2));
}

// Step 2: Install dependencies
console.log('✅ Step 2: Installing dependencies (this may take 2 minutes)...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (e) {
  console.log('⚠️ npm install had issues, trying again...');
  execSync('npm install', { stdio: 'inherit' });
}

// Step 3: Check critical files
console.log('\n✅ Step 3: Checking files...');
const requiredFiles = [
  'server.js',
  'models/User.js',
  'models/Client.js',
  'models/Invoice.js',
  'controllers/authController.js',
  'controllers/clientController.js',
  'controllers/invoiceController.js',
  'controllers/paymentController.js',
  'middleware/authMiddleware.js',
  'middleware/proMiddleware.js',
  'routes/authRoutes.js',
  'routes/clientRoutes.js',
  'routes/invoiceRoutes.js',
  'routes/paymentRoutes.js',
  'utils/generatePDF.js',
  'templates/invoiceTemplate.js'
];

let allGood = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} MISSING!`);
    allGood = false;
  }
});

if (!allGood) {
  console.log('\n⚠️ Some files are missing. You need to recreate them.');
} else {
  console.log('\n🎉 All files found!');
}

// Step 4: Check .env
console.log('\n✅ Step 4: Checking .env...');
if (!fs.existsSync('.env')) {
  console.log('❌ .env file missing! Creating template...');
  fs.writeFileSync('.env', `PORT=5000
MONGO_URI=mongodb://divyanshmeena5285:YOUR_NEW_PASSWORD@ac-xideucb-shard-00-00.5pbblro.mongodb.net:27017,ac-xideucb-shard-00-01.5pbblro.mongodb.net:27017,ac-xideucb-shard-00-02.5pbblro.mongodb.net:27017/?ssl=true&replicaSet=atlas-htjwnh-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster3
JWT_SECRET=bec625ec3264618ea5662ac305645935cc9ed4342f036a94cb8c6162aa733310301533dfc2b01b7c3fb0ff2570eb1219432049845427195b115f1d82e6037f3d
STRIPE_SECRET_KEY=sk_test_dummy
STRIPE_WEBHOOK_SECRET=whsec_dummy
EMAIL_USER=test@test.com
EMAIL_PASS=testpass
CLIENT_URL=http://localhost:5173`);
  console.log('⚠️ Created .env template — UPDATE YOUR MONGO PASSWORD!');
}

console.log('\n✅ DONE! Now run: npm run dev');