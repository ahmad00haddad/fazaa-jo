import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[PAGE CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR]: ${err.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ERROR] ${response.status()} ${response.url()}`);
    }
  });

  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log(`[NAVIGATED] ${frame.url()}`);
    }
  });

  console.log("Navigating to http://localhost:8080 ...");
  
  try {
    await page.goto('http://localhost:8080');
    console.log("Initial load complete. Waiting 10 seconds to observe behavior...");
    await page.waitForTimeout(10000);
  } catch (err) {
    console.error("Navigation failed:", err);
  }

  await browser.close();
})();
