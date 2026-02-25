import { spawn } from "node:child_process";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.E2E_PORT || 3000 + Math.floor(Math.random() * 1000));
const baseUrl = `http://127.0.0.1:${port}`;

async function waitForServer(url, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {}
    await delay(1000);
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

function startNextDev() {
  const lockPath = path.join(process.cwd(), ".next", "dev", "lock");
  try {
    fs.rmSync(lockPath, { force: true });
  } catch {}

  const child = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.payload",
    },
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  child.stdout.on("data", (buf) => process.stdout.write(`[next] ${buf}`));
  child.stderr.on("data", (buf) => process.stderr.write(`[next] ${buf}`));
  return child;
}

async function run() {
  const server = startNextDev();
  let browser;
  try {
    console.log("Waiting for Next dev server...");
    await waitForServer(`${baseUrl}/e2e-section-renderer`);
    console.log("Server is up.");

    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const pageErrors = [];
    const consoleErrors = [];

    page.on("pageerror", (err) => pageErrors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.addInitScript(() => {
      localStorage.setItem("language", "en");
      localStorage.setItem(
        "somnus-cart",
        JSON.stringify([
          {
            product: {
              id: "p1",
              name: { en: "Night Oil", zh: "Night Oil", jp: "Night Oil", ko: "Night Oil" },
              price: 1200,
              image: "",
            },
            quantity: 1,
            variant: {
              id: "v1",
              name: { en: "30ml", zh: "30ml", jp: "30ml", ko: "30ml" },
            },
          },
        ])
      );
    });

    console.log("Visiting SectionRenderer regression harness...");
    await page.goto(`${baseUrl}/e2e-section-renderer`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const harnessVisible = await page.locator("text=E2E SectionRenderer regression harness").isVisible();
    if (!harnessVisible) {
      const bodyText = await page.locator("body").innerText().catch(() => "");
      const html = await page.content().catch(() => "");
      throw new Error(
        `Harness page did not render.\nBody:\n${bodyText.slice(0, 500)}\n\nPageErrors:\n${pageErrors.join("\n")}\n\nConsoleErrors:\n${consoleErrors.join("\n")}\n\nHTML:\n${html.slice(0, 1000)}`
      );
    }

    console.log("Visiting checkout with multilingual cart payload...");
    await page.goto(`${baseUrl}/checkout`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const checkoutVisible = await page.getByRole("heading", { name: "Secure Checkout" }).isVisible();
    if (!checkoutVisible) {
      const bodyText = await page.locator("body").innerText().catch(() => "");
      throw new Error(
        `Checkout page did not render.\nBody:\n${bodyText.slice(0, 500)}\n\nPageErrors:\n${pageErrors.join("\n")}\n\nConsoleErrors:\n${consoleErrors.join("\n")}`
      );
    }

    const pageErrorText = [...pageErrors, ...consoleErrors].join("\n");
    if (/Minified React error #31|Objects are not valid as a React child/i.test(pageErrorText)) {
      throw new Error(`Detected React object-render error:\n${pageErrorText}`);
    }

    console.log("E2E regression checks passed.");
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill("SIGTERM");
    if (process.platform === "win32" && server.pid) {
      try {
        await import("node:child_process").then(({ execSync }) =>
          execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" })
        );
      } catch {}
    }
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
