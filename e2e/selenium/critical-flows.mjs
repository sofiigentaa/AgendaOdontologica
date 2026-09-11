/**
 * Selenium WebDriver — mismos flujos críticos que Playwright.
 * Requiere Chrome instalado. Selenium Manager descarga el driver.
 */
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const BASE = process.env.SELENIUM_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

async function login(driver) {
  await driver.get(BASE + '/');
  const email = await driver.wait(until.elementLocated(By.css('[data-testid="auth-email"]')), 15000);
  await email.sendKeys('e2e@consultorio.test');
  await driver.findElement(By.css('[data-testid="auth-password"]')).sendKeys('admin123');
  await driver.findElement(By.css('[data-testid="auth-submit"]')).click();
  await driver.wait(until.stalenessOf(email), 15000);
}

async function run() {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1400,900');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await login(driver);
    await driver.findElement(By.id('tab-calendar-main')).click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'HOY')]")), 10000);
    await driver.findElement(By.css('[data-testid="calendar-view-list"]')).click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'Lista Cronológica de Turnos')]")), 10000);
    await driver.findElement(By.id('btn-open-finances')).click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'Finanzas y Liquidación')]")), 10000);
    console.log('Selenium: PASS (calendario + finanzas)');
  } finally {
    await driver.quit();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
