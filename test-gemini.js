const key = "AIzaSyDItJJdf_XuxoGEw_Ncgy8erCRohh-xI7A";
async function run() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await res.json();
  if (data.error) {
    console.error("Error:", data.error.message);
  } else {
    console.log(data.models.map(m => m.name).join("\n"));
  }
}
run();
