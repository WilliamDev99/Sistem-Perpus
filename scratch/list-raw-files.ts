import fs from "fs";
import path from "path";

// Let's print the actual file names and search if we can match the book titles
const localDir = "c:/Users/PC/OneDrive/Desktop/Sistem Perpustakaan/public/uploads";
const files = fs.readdirSync(localDir);

console.log("All upload files (47 files):");
console.log(files);
