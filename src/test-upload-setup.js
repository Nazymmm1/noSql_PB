// Run this file to manually create the uploads folder and test the setup
// Usage: node test-upload-setup.js

const fs = require('fs');
const path = require('path');

console.log("🧪 Testing upload setup...\n");

// Find the uploads directory location
const uploadsDir = path.join(__dirname, '..', 'uploads');

console.log("📁 Expected uploads directory:", uploadsDir);
console.log("📁 Absolute path:", path.resolve(uploadsDir));

// Check if directory exists
if (fs.existsSync(uploadsDir)) {
  console.log("✅ Uploads directory already exists!");
  
  // List files in directory
  const files = fs.readdirSync(uploadsDir);
  console.log(`📄 Files in uploads (${files.length}):`, files);
} else {
  console.log("❌ Uploads directory does not exist");
  console.log("📁 Creating uploads directory...");
  
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ Uploads directory created successfully!");
  } catch (error) {
    console.error("❌ Error creating directory:", error.message);
  }
}

// Test write permissions
console.log("\n🧪 Testing write permissions...");
const testFile = path.join(uploadsDir, 'test.txt');

try {
  fs.writeFileSync(testFile, 'This is a test file');
  console.log("✅ Write test successful!");
  
  // Clean up test file
  fs.unlinkSync(testFile);
  console.log("🗑️  Test file deleted");
} catch (error) {
  console.error("❌ Write test failed:", error.message);
}

console.log("\n✅ Setup test complete!");
console.log("\n📝 Next steps:");
console.log("1. Make sure 'multer' is installed: npm install multer");
console.log("2. Restart your server");
console.log("3. Try the Postman request again");