import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

async function uploadZip() {
  const localZipPath = "c:/Users/PC/OneDrive/Desktop/Sistem Perpustakaan/public/uploads.zip";
  const targetUrl = "https://sistem-perpus-production.up.railway.app/api/sync-covers";

  console.log(`Uploading ${localZipPath} to ${targetUrl}...`);

  if (!fs.existsSync(localZipPath)) {
    console.error("Local zip file not found! Execute zip command first.");
    return;
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(localZipPath));

  try {
    const response = await axios.post(targetUrl, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log("Success Response:", response.data);
  } catch (error: any) {
    console.error("Upload failed!");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

uploadZip();
