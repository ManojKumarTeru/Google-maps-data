import fs from "fs";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";

// ✅ Load your scraped data
const businesses = JSON.parse(fs.readFileSync("Cafes_in_London.json", "utf-8"));

// ✅ Gmail transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "manojteru963@gmail.com",              // <-- replace with your Gmail
    pass: "pgql arob rojm hwmd",           // <-- create from Google App Passwords
  },
});

// ✅ Message template (you can customize)
const messageTemplate = (name) => `
Hi ${name || "there"},

I visited your café’s website and noticed great potential to improve online visibility.
We build modern, high-performing websites for cafés and restaurants at affordable prices.

Would you like to see a free demo for your business?

Best regards,
Manoj
Web Developer
`;

// ✅ Function 1: Send Email
async function sendEmail(to, name) {
  try {
    const mailOptions = {
      from: "your@gmail.com",
      to,
      subject: `Website design ideas for ${name || "your café"}`,
      text: messageTemplate(name),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.log(`❌ Failed email to ${to}: ${err.message}`);
  }
}

// ✅ Function 2: WhatsApp Link Generator
function createWhatsAppLink(phone, name) {
  const clean = phone.replace(/[^\d]/g, "");
  const msg = messageTemplate(name)
    .replace(/\n+/g, " ")
    .trim();
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

// ✅ Function 3: Auto-fill Contact Forms (Advanced)
async function sendContactForm(website, name) {
  console.log(`🌐 Trying contact form on ${website}`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(website, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Try visiting /contact or /about automatically
    const urlsToTry = [website, `${website}/contact`, `${website}/contact-us`, `${website}/about`];
    for (const url of urlsToTry) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

        const hasForm = await page.$("form");
        if (!hasForm) continue;

        // Fill name field
        const nameField = await page.$('input[name*=name], input[id*=name], input[type=text]');
        if (nameField) await nameField.type("Manoj (Web Developer)");

        // Fill email field
        const emailField = await page.$('input[name*=email], input[id*=email], input[type=email]');
        if (emailField) await emailField.type("your@gmail.com");

        // Fill message textarea
        const messageField = await page.$("textarea");
        if (messageField) await messageField.type(messageTemplate(name));

        // Try submitting form
        const submitBtn = await page.$('button[type=submit], input[type=submit]');
        if (submitBtn) await submitBtn.click();

        console.log(`✅ Submitted form at ${url}`);
        await browser.close();
        return true;
      } catch {}
    }

    console.log(`⚠️ No contact form found on ${website}`);
  } catch (err) {
    console.log(`❌ Error visiting ${website}: ${err.message}`);
  } finally {
    await browser.close();
  }
}

// ✅ Master Function
async function contactBusinesses() {
  for (const b of businesses) {
    const { name, email, phone, website } = b;

    console.log(`\n🚀 Contacting: ${name}`);

    if (email && email !== "N/A") {
      await sendEmail(email, name);
    } else if (phone && phone !== "N/A") {
      const whatsapp = createWhatsAppLink(phone, name);
      console.log(`📱 WhatsApp: ${whatsapp}`);
    } else if (website && website !== "N/A") {
      await sendContactForm(website, name);
    } else {
      console.log(`⚠️ No contact info found for ${name}`);
    }

    // Small delay between businesses to avoid spam flags
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log(`\n✅ Finished contacting all businesses.`);
}

contactBusinesses();
