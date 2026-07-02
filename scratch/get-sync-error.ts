import axios from "axios";

async function checkSync() {
  try {
    const res = await axios.get("https://sistem-perpus-production.up.railway.app/api/sync-covers");
    console.log("Success:", res.data);
  } catch (error: any) {
    if (error.response) {
      console.log("Failed with Status:", error.response.status);
      console.log("Error details:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

checkSync();
