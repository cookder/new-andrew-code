const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing Sales Intelligence Platform Database...\n');

try {
  // Check if .env.local exists
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  Creating .env.local file...');
    const envExample = `# Database
DATABASE_URL="file:./dev.db"

# AI API Keys (Add your keys here)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Authentication
ADMIN_PASSWORD=admin123

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
`;
    fs.writeFileSync(envPath, envExample);
    console.log('✅ Created .env.local\n');
    console.log('⚠️  IMPORTANT: Please update .env.local with your actual API keys!\n');
  }

  // Create uploads directory
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory\n');
  }

  // Note about Prisma
  console.log('📝 Next steps to initialize the database:\n');
  console.log('1. Install Prisma engines (if not already installed):');
  console.log('   npm install @prisma/client\n');
  console.log('2. Generate Prisma client:');
  console.log('   npx prisma generate\n');
  console.log('3. Push schema to database:');
  console.log('   npx prisma db push\n');
  console.log('4. (Optional) Open Prisma Studio to view data:');
  console.log('   npx prisma studio\n');

  console.log('✅ Setup preparation complete!\n');

} catch (error) {
  console.error('❌ Error during initialization:', error.message);
  process.exit(1);
}
