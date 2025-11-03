import axios from "axios";
import fs from "fs";

const API_KEY = "6a5dfc91504fb7221c60deef229abbca8d7c6e421566cc5269c5b66a012ee611";

// Function to extract email from website HTML
async function getEmailFromWebsite(url) {
  console.log("am checking for website email");
  try {
    if (!url || url === "N/A" || !url.startsWith("http")) return "N/A";
    const res = await axios.get(url, { timeout: 10000 }); // 10s timeout
    const emailMatch = res.data.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
    return emailMatch ? emailMatch[0] : "N/A";
  } catch {
    return "N/A";
  }
}

async function getPlaces() {
  const allResults = [];
  const query = "Schools in Nellore, India";
  const ll = "@14.4426,79.9865,14z"; // Nellore coordinates
  const totalPages = 1; // You can change this to 5 or more

  for (let page = 0; page < totalPages; page++) {
    const start = page * 20;
    console.log(`📄 Fetching page ${page + 1}...`);

    const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
      query
    )}&ll=${encodeURIComponent(ll)}&start=${start}&api_key=${API_KEY}`;

    const res = await axios.get(url);
    if (!res.data.local_results || res.data.local_results.length === 0) {
      console.log("⚠️ No more results found.");
      break;
    }

    for (const b of res.data.local_results) {
      const website = b.website || "N/A";
      const email = await getEmailFromWebsite(website);
      console.log(`✅ Fetched: ${b.title} | 📧 ${email}`);

      allResults.push({
        name: b.title || "N/A",
        rating: b.rating || "N/A",
        reviews: b.reviews || "N/A",
        phone: b.phone || "N/A",
        address: b.address || "N/A",
        website,
        email,
        type: b.type || "N/A",
        hours: b.hours || "N/A",
        thumbnail: b.thumbnail || "N/A",
        gps_coordinates: b.gps_coordinates || "N/A",
        description: b.description || "N/A",
        service_options: b.service_options || "N/A",
      });

      await new Promise((r) => setTimeout(r, 1500)); // 1.5s delay between requests
    }
  }

  fs.writeFileSync("nellore_apartments_with_emails.json", JSON.stringify(allResults, null, 2));
  console.log(`✅ Saved ${allResults.length} apartments to nellore_apartments_with_emails.json`);
}

getPlaces().catch(console.error);
