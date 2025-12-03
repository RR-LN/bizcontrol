const fs = require('fs');
const path = require('path');

const envContent = `DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="super-secret-key-dev-change-in-prod"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary Configuration (Free Tier)
# Obtenha suas credenciais em: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent, { encoding: 'utf8' });
console.log('.env file updated with Cloudinary configuration');
