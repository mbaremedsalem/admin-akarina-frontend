import puppeteer from "puppeteer-core";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 1400, height: 1000 } });
function log(label, ok, extra = "") {
  console.log(`[${ok ? "OK" : "FAIL"}] ${label}${extra ? " - " + extra : ""}`);
}

try {
  const page = await browser.newPage();
  await page.goto("http://localhost:5190/login", { waitUntil: "domcontentloaded" });
  await wait(800);
  const inputs = await page.$$("input");
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type("__multi_gest_staff__", { delay: 10 });
  await inputs[1].click({ clickCount: 3 });
  await inputs[1].type("x", { delay: 10 });
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
  ]);
  await wait(1500);

  await page.goto("http://localhost:5190/biens", { waitUntil: "domcontentloaded" });
  await wait(1500);

  const editBtn = await page.evaluateHandle(() => {
    const rows = [...document.querySelectorAll("tbody tr")];
    const row = rows.find((r) => r.textContent.includes("Test Multi Gest Bien") || r.textContent.includes("AGH-APP-E99CDF3E"));
    if (!row) return null;
    const btns = [...row.querySelectorAll(".row-actions button")];
    return btns.find((b) => b.textContent.includes("Modifier"));
  });
  const editEl = editBtn.asElement();
  log("Found edit button for test bien", Boolean(editEl));
  if (editEl) {
    await editEl.click();
    await wait(700);

    const checkedManagers = await page.evaluate(() => {
      const chips = [...document.querySelectorAll(".modal-card .checkbox-chip")];
      return chips
        .filter((c) => c.querySelector("input")?.checked)
        .map((c) => c.querySelector("span")?.textContent);
    });
    log(
      "Both test managers appear pre-checked in the form",
      checkedManagers.includes("__multi_gest_mgr1__") && checkedManagers.includes("__multi_gest_mgr2__"),
      JSON.stringify(checkedManagers)
    );

    await page.screenshot({ path: "_multi_gest_admin_form.png" });
  }

  console.log("DONE");
} catch (err) {
  console.error("ERROR", err.message);
} finally {
  await browser.close();
}
