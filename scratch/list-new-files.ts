import fs from "fs";
import path from "path";

const localDir = "c:/Users/PC/OneDrive/Desktop/Sistem Perpustakaan/public/uploads";
const files = fs.readdirSync(localDir);

console.log("Current files in public/uploads:");
console.log(files);
