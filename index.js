import axios from "axios";
import fs from "fs";
import * as cheerio from "cheerio";
import https from "https";

const API_KEY = "6a5dfc91504fb7221c60deef229abbca8d7c6e421566cc5269c5b66a012ee611";

// ✅ Create a safe axios instance
const agent = new https.Agent({ keepAlive: true, maxSockets: 5 });
const client = axios.create({
  httpsAgent: agent,
  timeout: 10000,
});

// ✅ Helper to extract email from one page
async function extractEmail(url) {
  try {
    if (!url || url === "N/A" || !url.startsWith("http")) return "N/A";

    const { data: html } = await client.get(url);
    const $ = cheerio.load(html);

    const visibleText = $("body")
      .find("*")
      .contents()
      .filter(function () {
        return this.type === "text";
      })
      .text();

    let emails = visibleText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    emails = [...new Set(emails)];

    const ignoredPatterns = [
      "example@",
      "test@",
      "logo@",
      "image@",
      "sentry-",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      "wixpress.com",
      "shopify.com",
      "cloudflare.com",
      "wordpress.org",
    ];

    emails = emails.filter(email => !ignoredPatterns.some(p => email.toLowerCase().includes(p)));
    return emails.length > 0 ? emails[0] : "N/A";
  } catch {
    return "N/A";
  }
}

// ✅ Try multiple pages (main + contact/about)
async function getEmailFromWebsite(baseUrl) {
  const urlsToTry = [baseUrl, `${baseUrl}/contact`, `${baseUrl}/about`, `${baseUrl}/contact-us`];
  for (const url of urlsToTry) {
    const email = await extractEmail(url);
    if (email !== "N/A") return email;
    await new Promise(r => setTimeout(r, 800)); // small delay
  }
  return "N/A";
}

// ✅ Main function
async function getPlaces() {
  const allResults = [];

  const query = "Cafes in London, UK";
  const ll = "@51.5072,-0.1276,13z";
  
  const totalPages = 2;

  for (let page = 0; page < totalPages; page++) {
    const start = page * 20;
    console.log(`📄 Fetching page ${page + 1}...`);

    const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
      query
    )}&ll=${encodeURIComponent(ll)}&start=${start}&api_key=${API_KEY}`;

    const res = await client.get(url);
    if (!res.data.local_results || res.data.local_results.length === 0) {
      console.log("⚠️ No more results found.");
      break;
    }

    for (const b of res.data.local_results) {
      const website = b.website || "N/A";
      const email = await getEmailFromWebsite(website);
      console.log(`✅ ${b.title} | 📧 ${email}`);

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

      await new Promise((r) => setTimeout(r, 2000)); // delay between businesses
    }
  }

  fs.writeFileSync("Cafes_in_London.json", JSON.stringify(allResults, null, 2));
  console.log(`✅ Saved ${allResults.length} businesses`);
}

getPlaces().catch(console.error);
