const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
// This creates it relative to the project root
const uploadDir = path.join(__dirname, "..", "..", "uploads");

console.log("📁 Upload directory path:", uploadDir);

if (!fs.existsSync(uploadDir)) {
  console.log("📁 Creating uploads directory...");
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Uploads directory created!");
} else {
  console.log("✅ Uploads directory already exists");
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Saving file to:", uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomnumber.extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = "post-" + uniqueSuffix + path.extname(file.originalname);
    console.log("Generated filename:", filename);
    cb(null, filename);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  console.log("Checking file type:", file.mimetype);
  
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    console.log("File type accepted");
    cb(null, true);
  } else {
    console.log("File type rejected");
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

module.exports = upload;