const puppeteer = require('puppeteer');

async function testPDFPage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.setViewport({ width: 1200, height: 800 });

    const bidLineId = 'cmf7pnxl507hwuah9bbdaca2x';
    const url = `http://localhost:3004/en/pdf/bid-line-metrics/${bidLineId}`;
    
    console.log('Navigating to:', url);
    
    const response = await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('Response status:', response.status());
    console.log('Response URL:', response.url());
    
    // Get the page content
    const content = await page.content();
    console.log('Page content length:', content.length);
    
    // Check if the page has any error message
    const bodyText = await page.evaluate(() => document.body?.innerText || 'No body text');
    console.log('Body text preview:', bodyText.substring(0, 500));
    
    // Try to find the data-pdf-content element
    const hasPdfContent = await page.evaluate(() => {
      return document.querySelector('[data-pdf-content]') !== null;
    });
    console.log('Has [data-pdf-content] element:', hasPdfContent);
    
    // Get all elements with data- attributes
    const dataElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-*]');
      return Array.from(elements).map(el => {
        const attrs = Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => attr.name);
        return {
          tag: el.tagName,
          attrs: attrs,
          text: el.textContent?.substring(0, 50)
        };
      });
    });
    console.log('Elements with data- attributes:', dataElements);
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testPDFPage();