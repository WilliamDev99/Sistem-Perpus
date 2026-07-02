import fs from "fs";
import path from "path";

function scanUploads() {
  const dir = "c:/Users/PC/OneDrive/Desktop/Sistem Perpustakaan/public/uploads";
  const files = fs.readdirSync(dir);
  
  console.log("Found files count:", files.length);
  const details = files.map(file => {
    const stats = fs.statSync(path.join(dir, file));
    return {
      name: file,
      size: stats.size,
      created: stats.birthtime
    };
  });
  
  // Sort by creation date (newest first)
  details.sort((a, b) => b.created.getTime() - a.created.getTime());
  
  console.log("Recent files list:");
  console.log(JSON.stringify(details.slice(0, 15), null, 2));
}

scanUploads();
