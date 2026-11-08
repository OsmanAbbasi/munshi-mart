import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// Dependency-free Chromium QA using the DevTools protocol. No external pages visited.
// Start the fixture-enabled production server separately; see README.md.
const base = process.env.QA_BASE_URL || "http://localhost:3100";
const selectedModes = ['QA_POLISH', 'QA_SHOPPING', 'QA_LIVE'].filter(name => process.env[name] === '1');
assert.ok(selectedModes.length <= 1, 'Select only one QA mode: QA_POLISH, QA_SHOPPING or QA_LIVE. This prevents fixture results from being mistaken for live checks.');
const executable =
  process.env.QA_BROWSER ||
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const out = path.resolve(".qa");
const profile = path.join(out, `edge-${Date.now()}`);
await mkdir(profile, { recursive: true });
const browser = spawn(
  executable,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let socket;
let diagnose;
const report = [];
const exceptions = [];
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try {
      port = (
        await readFile(path.join(profile, "DevToolsActivePort"), "utf8")
      ).split("\n")[0];
      break;
    } catch {
      await delay(100);
    }
  }
  assert.ok(port, "Chromium did not start");
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map();
  let interceptRequest = null;
  socket.onclose = (event) => {
    for (const promise of pending.values())
      promise.reject(
        new Error(`DevTools socket closed: ${event.code} ${event.reason}`),
      );
    pending.clear();
  };
  socket.onmessage = (event) => {
    const message = JSON.parse(String(event.data));
    if (message.method === "Fetch.requestPaused" && interceptRequest)
      void interceptRequest(message.params);
    if (message.method === "Runtime.exceptionThrown")
      exceptions.push(message.params.exceptionDetails.text);
    if (message.id) {
      const promise = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) promise?.reject(new Error(message.error.message));
      else promise?.resolve(message.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`DevTools timed out: ${method}`));
      }, 15000);
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  diagnose = () =>
    evaluate(
      `JSON.stringify({path:location.pathname,text:document.querySelector('main')?.innerText,cart:localStorage.getItem('munshi-cart')})`,
    );
  const waitFor = async (expression) => {
    for (let i = 0; i < 120; i++) {
      try {
        if (await evaluate(expression)) return;
      } catch {
        /* navigation replaces the JS context */
      }
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const visit = async (route, selector = "h1") => {
    await send("Page.navigate", { url: base + route });
    await waitFor(
      `document.readyState === 'complete' && !!document.querySelector(${JSON.stringify(selector)})`,
    );
    await delay(180);
  };
  const check = (label, condition) => {
    assert.ok(condition, label);
    report.push({ check: label, result: "pass" });
  };
  const ids = () =>
    evaluate(
      `Array.from(document.querySelectorAll('[data-product-id]')).map(el => el.dataset.productId)`,
    );
  const screenshot = async (name) => {
    await evaluate(
      `document.activeElement instanceof HTMLElement && document.activeElement.blur()`,
    );
    // Scroll the page to exercise lazy-loaded catalog images before a full-page capture.
    await evaluate(
      `(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); })()`,
    );
    for (let i = 0; i < 40; i++) {
      if (
        await evaluate(`Array.from(document.images).every(img => img.complete)`)
      )
        break;
      await delay(100);
    }
    const result = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await writeFile(
      path.join(out, name + ".png"),
      Buffer.from(result.data, "base64"),
    );
  };
  await send("Page.enable");
  await send("Runtime.enable");
  if (process.env.QA_POLISH === "1") {
    const audit = (label, condition, detail) =>
      report.push({
        check: label,
        result: condition ? "pass" : "fail",
        ...(detail === undefined ? {} : { detail }),
      });
    const keyboard = async (key, code, virtualKey, modifiers = 0) => {
      await send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key,
        code,
        windowsVirtualKeyCode: virtualKey,
        nativeVirtualKeyCode: virtualKey,
        modifiers,
        ...(key === "Enter" ? { text: "\r" } : {}),
      });
      await send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key,
        code,
        windowsVirtualKeyCode: virtualKey,
        modifiers,
      });
      await delay(100);
    };
    const p1 = "20000000-0000-4000-8000-000000000001";
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await visit("/products");
    await waitFor(
      `!document.querySelector('[data-save-product="${p1}"]').disabled`,
    );
    await evaluate(`document.querySelector('.mobile-menu-btn').click()`);
    await keyboard("Escape", "Escape", 27);
    audit(
      "mobile navigation closes with Escape",
      await evaluate(`!document.querySelector('#mobile-nav')`),
    );
    if (await evaluate(`!!document.querySelector('#mobile-nav')`))
      await evaluate(`document.querySelector('.mobile-menu-btn').click()`);
    await evaluate(`document.querySelector('#cart-toggle-btn').focus()`);
    await keyboard("Enter", "Enter", 13);
    await waitFor(`!!document.querySelector('[aria-label="Shopping cart"]')`);
    audit(
      "keyboard cart trigger focuses close control",
      await evaluate(`document.activeElement.id === 'cart-close-btn'`),
    );
    audit(
      "drawer prevents background scrolling",
      await evaluate(`getComputedStyle(document.body).overflow === 'hidden'`),
    );
    audit(
      "drawer removes background from keyboard/accessibility navigation",
      await evaluate(
        `document.querySelector('main').inert || !!document.querySelector('main').closest('[inert]')`,
      ),
    );
    const focus = await evaluate(
      `(() => { const s=getComputedStyle(document.activeElement);return {style:s.outlineStyle,width:parseFloat(s.outlineWidth)}; })()`,
    );
    audit(
      "keyboard focus outline is visible",
      focus.style !== "none" && focus.width >= 2,
      focus,
    );
    await evaluate(
      `(() => {const c=document.querySelector('[aria-label="Shopping cart"]').querySelectorAll('a[href],button:not([disabled]),input:not([disabled])');c[c.length-1].focus();})()`,
    );
    await keyboard("Tab", "Tab", 9);
    audit(
      "drawer Tab wraps to first control",
      await evaluate(`document.activeElement.id === 'cart-close-btn'`),
    );
    await evaluate(
      `window.__tabLog=[];document.addEventListener('keydown',e=>{if(e.key==='Tab')window.__tabLog.push({shift:e.shiftKey,active:document.activeElement.outerHTML})},{capture:true,once:true})`,
    );
    await keyboard("Tab", "Tab", 9, 8);
    audit(
      "drawer Shift-Tab wraps to last control",
      await evaluate(
        `document.activeElement === Array.from(document.querySelector('[aria-label="Shopping cart"]').querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')).at(-1)`,
      ),
      await evaluate(
        `({events:window.__tabLog,active:document.activeElement.outerHTML.slice(0,300),last:Array.from(document.querySelector('[aria-label="Shopping cart"]').querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')).at(-1)?.outerHTML})`,
      ),
    );
    await keyboard("Escape", "Escape", 27);
    audit(
      "Escape closes drawer and restores trigger focus",
      await evaluate(
        `!document.querySelector('[aria-label="Shopping cart"]') && document.activeElement.id === 'cart-toggle-btn'`,
      ),
    );
    audit(
      "drawer cleanup restores background scrolling and interactivity",
      await evaluate(
        `getComputedStyle(document.body).overflow !== 'hidden' && !document.querySelector('main').inert && !document.querySelector('main').closest('[inert]')`,
      ),
    );
    const contrast = await evaluate(
      `(() => {const e=document.querySelector('.missing-image'); let bg=e;while(bg && ['rgba(0, 0, 0, 0)','transparent'].includes(getComputedStyle(bg).backgroundColor))bg=bg.parentElement;return {fg:getComputedStyle(e).color,bg:bg?getComputedStyle(bg).backgroundColor:'rgb(255,255,255)'};})()`,
    );
    const luminance = (color) =>
      color
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map((n) => Number(n) / 255)
        .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
        .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
    const a = luminance(contrast.fg),
      b = luminance(contrast.bg),
      ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    audit("missing-image description meets 4.5:1 text contrast", ratio >= 4.5, {
      ...contrast,
      ratio,
    });
    audit(
      "floating WhatsApp link explicitly identifies platform support",
      await evaluate(
        `document.querySelector('a[title="Chat on WhatsApp"], .platform-whatsapp')?.getAttribute('aria-label').toLowerCase().includes('platform support') || false`,
      ),
    );
    await visit("/products?category=Groceries");
    audit(
      "empty category shows clear empty state",
      await evaluate(
        `!!document.querySelector('.empty-state') && document.querySelectorAll('[data-product-id]').length===0`,
      ),
    );
    await visit("/products/20000000-0000-4000-8000-000000000088");
    audit(
      "unknown product shows unavailable page",
      await evaluate(
        `!!document.querySelector('.not-found') && !document.querySelector('.product-info')`,
      ),
    );
    await visit("/seller/10000000-0000-4000-8000-000000000088");
    audit(
      "unknown seller shows unavailable page",
      await evaluate(
        `!!document.querySelector('.not-found') && !document.querySelector('.store-profile')`,
      ),
    );
    for (const width of [320, 390, 768, 1440]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
      for (const route of [
        "/products",
        "/cart",
        "/wishlist",
        `/products/${p1}`,
      ]) {
        await visit(route);
        audit(
          `${width}px ${route} has no horizontal overflow`,
          await evaluate(
            `document.documentElement.scrollWidth <= innerWidth+1`,
          ),
        );
      }
    }
    // Exercise actual buyer controls, then intercept external handoffs before any network traffic.
    const p2 = "20000000-0000-4000-8000-000000000002";
    const sellerA = "10000000-0000-4000-8000-000000000001";
    const sellerB = "10000000-0000-4000-8000-000000000002";
    await visit(`/products/${p1}`);
    await waitFor(
      `!document.querySelector('[data-save-product="${p1}"]').disabled`,
    );
    await evaluate(
      `document.querySelector('[data-save-product="${p1}"]').click();document.querySelector('.product-actions > button').click()`,
    );
    await waitFor(`!!document.querySelector('#cart-close-btn')`);
    await keyboard("Escape", "Escape", 27);
    await visit(`/products/${p2}`);
    await waitFor(
      `!document.querySelector('.product-actions > button').disabled`,
    );
    await evaluate(
      `document.querySelector('.product-actions > button').click()`,
    );
    await waitFor(`!!document.querySelector('#cart-close-btn')`);
    await keyboard("Escape", "Escape", 27);
    await visit("/cart");
    await waitFor(
      `document.querySelectorAll('[data-availability="available"]').length === 2`,
    );
    await evaluate(
      `(()=>{const el=document.querySelector('[data-saved-id="${p1}"] input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'2');el.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await waitFor(
      `JSON.parse(localStorage.getItem('munshi-cart')).find(i=>i.id==='${p1}').cartQty===2`,
    );
    await send("Page.reload");
    await waitFor(
      `document.querySelectorAll('[data-availability="available"]').length === 2`,
    );
    audit(
      "fresh buyer journey preserves two-seller cart and wishlist after reload",
      await evaluate(
        `document.querySelectorAll('[data-cart-seller]').length===2 && document.querySelector('[data-saved-id="${p1}"] input').value==='2' && JSON.parse(localStorage.getItem('munshi-wishlist')).some(i=>i.id==='${p1}')`,
      ),
    );
    const handoffs = [];
    let prepareRequests = 0;
    interceptRequest = async (params) => {
      if (params.request.url.startsWith("https://wa.me/")) {
        if (params.resourceType === "Document")
          handoffs.push(params.request.url);
        await send("Fetch.fulfillRequest", {
          requestId: params.requestId,
          responseCode: 200,
          responseHeaders: [{ name: "Content-Type", value: "text/html" }],
          body: Buffer.from(
            "<!doctype html><title>Local handoff interception</title><h1>Intercepted WhatsApp handoff</h1>",
          ).toString("base64"),
        });
      } else {
        prepareRequests++;
        await send("Fetch.continueRequest", { requestId: params.requestId });
      }
    };
    await send("Fetch.enable", {
      patterns: [
        { urlPattern: "https://wa.me/*", requestStage: "Request" },
        { urlPattern: "*/api/checkout/prepare", requestStage: "Request" },
      ],
    });
    for (const [seller, product, number, quantity] of [
      [sellerA, p1, "12025550101", 2],
      [sellerB, p2, "12025550102", 1],
    ]) {
      const requestsBefore = prepareRequests;
      const savedBefore = await evaluate(`localStorage.getItem('munshi-cart')`);
      await evaluate(
        `document.querySelector('[data-checkout-seller="${seller}"] button').click()`,
      );
      await waitFor(
        `!!document.querySelector('[data-checkout-link="${seller}"]')`,
      );
      const link = new URL(
        await evaluate(
          `document.querySelector('[data-checkout-link="${seller}"]').href`,
        ),
      );
      const text = link.searchParams.get("text");
      audit(
        `seller ${seller} handoff contains only its recipient, quantity and product URL`,
        link.pathname === "/" + number &&
          text.includes(`× ${quantity}`) &&
          text.includes(`${base}/products/${product}`) &&
          !text.includes(product === p1 ? p2 : p1),
      );
      await evaluate(
        `document.querySelector('[data-checkout-link="${seller}"]').click()`,
      );
      await waitFor(
        `document.querySelector('h1')?.textContent==='Intercepted WhatsApp handoff'`,
      );
      audit(
        `seller ${seller} rechecks immediately before intercepted handoff`,
        prepareRequests === requestsBefore + 2 &&
          new URL(handoffs.at(-1)).pathname === "/" + number,
      );
      await visit("/cart");
      await waitFor(
        `document.querySelectorAll('[data-availability="available"]').length===2`,
      );
      audit(
        `seller ${seller} handoff preserves cart and wishlist`,
        await evaluate(
          `localStorage.getItem('munshi-cart')===${JSON.stringify(savedBefore)} && JSON.parse(localStorage.getItem('munshi-wishlist')).some(i=>i.id==='${p1}')`,
        ),
      );
    }
    await send("Fetch.disable");
    interceptRequest = null;
    audit(
      "both handoffs were intercepted locally without reaching WhatsApp",
      handoffs.length === 2,
    );
    await screenshot("final-desktop-cart");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await screenshot("final-mobile-cart");
    await visit("/wishlist");
    await screenshot("final-mobile-wishlist");
    // Return an actual failed image response; use the working second image afterward.
    await send("Network.enable");
    await send("Network.setCacheDisabled", { cacheDisabled: true });
    interceptRequest = (params) =>
      send("Fetch.fulfillRequest", {
        requestId: params.requestId,
        responseCode: 404,
        responseHeaders: [{ name: "Content-Type", value: "text/plain" }],
        body: "",
      });
    await send("Fetch.enable", {
      patterns: [
        { urlPattern: "*/fixtures/tote.svg", requestStage: "Request" },
      ],
    });
    await visit(`/products/${p1}`);
    await waitFor(`!!document.querySelector('.gallery-main .missing-image')`);
    audit(
      "failed gallery image shows a readable fallback",
      await evaluate(
        `document.querySelector('.gallery-main').textContent.includes('No image available')`,
      ),
    );
    await evaluate(
      `document.querySelector('[aria-label="View image 2"]').click()`,
    );
    await waitFor(
      `document.querySelector('.gallery-main img')?.naturalWidth>0`,
    );
    audit(
      "another gallery image still works after an image failure",
      await evaluate(
        `document.querySelector('.gallery-count').textContent.startsWith('2 /')`,
      ),
    );
    await send("Fetch.disable");
    interceptRequest = null;
    await send("Network.setCacheDisabled", { cacheDisabled: false });
    audit(
      "polish audit has no runtime exceptions",
      exceptions.length === 0,
      exceptions,
    );
    await writeFile(
      path.join(out, "polish-browser-results.json"),
      JSON.stringify({ base, checks: report, exceptions }, null, 2),
    );
    console.log(
      JSON.stringify({
        checks: report.length,
        failed: report.filter((r) => r.result === "fail"),
      }),
    );
    if (report.some((r) => r.result === "fail")) process.exitCode = 1;
  } else if (process.env.QA_SHOPPING === "1") {
    const sellerA = "10000000-0000-4000-8000-000000000001";
    const sellerB = "10000000-0000-4000-8000-000000000002";
    const sellerC = "10000000-0000-4000-8000-000000000004";
    const p1 = "20000000-0000-4000-8000-000000000001";
    const p2 = "20000000-0000-4000-8000-000000000002";
    const p4 = "20000000-0000-4000-8000-000000000004";
    const p7 = "20000000-0000-4000-8000-000000000007";
    const hidden = "20000000-0000-4000-8000-000000000099";
    const ready = () =>
      waitFor(
        `!!document.querySelector('[data-availability="available"]') && !document.querySelector('[data-availability="checking"]')`,
      );
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await visit("/products");
    await waitFor(
      `!document.querySelector('[data-save-product="${p1}"]').disabled`,
    );
    await evaluate(
      `localStorage.clear(); localStorage.setItem('munshi-cart', JSON.stringify([{id:'${p1}',product_name:'Legacy tote',retail_price:10,quantity:99,cartQty:4,sellers:{store_name:'Old store',whatsapp_number:'private@lid'}}]));`,
    );
    await visit("/cart");
    await ready();
    check(
      "legacy cart ID and quantity survive hydration",
      await evaluate(
        `document.querySelector('[data-saved-id="${p1}"] input').value === '4'`,
      ),
    );
    check(
      "legacy seller resolved from current product relation",
      await evaluate(
        `!!document.querySelector('[data-cart-seller="${sellerA}"]')`,
      ),
    );
    check(
      "legacy name and price refresh from current catalog",
      await evaluate(
        `document.querySelector('[data-saved-id="${p1}"]').textContent.includes('Canvas Everyday Tote') && !document.querySelector('main').textContent.includes('Legacy tote')`,
      ),
    );
    check(
      "legacy private fields not retained in storage",
      await evaluate(
        `!localStorage.getItem('munshi-cart').includes('private@lid')`,
      ),
    );
    await evaluate(
      `(() => { const el = document.querySelector('[data-saved-id="${p1}"] input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(el,'2'); el.dispatchEvent(new Event('input',{bubbles:true})); })()`,
    );
    await waitFor(
      `JSON.parse(localStorage.getItem('munshi-cart'))[0].cartQty === 2`,
    );
    await send("Page.reload");
    await ready();
    check(
      "quantity change persists after reload",
      await evaluate(
        `document.querySelector('[data-saved-id="${p1}"] input').value === '2'`,
      ),
    );
    check(
      "header count matches saved quantities",
      await evaluate(
        `!!document.querySelector('[aria-label="Open cart, 2 items"]')`,
      ),
    );
    await visit(`/products/${p1}`);
    await waitFor(
      `!document.querySelector('[data-save-product="${p1}"]').disabled`,
    );
    await evaluate(
      `document.querySelector('[data-save-product="${p1}"]').click()`,
    );
    await waitFor(
      `document.querySelector('[data-save-product="${p1}"]').getAttribute('aria-pressed') === 'true'`,
    );
    await visit("/products");
    check(
      "card save control follows detail save state",
      await evaluate(
        `document.querySelector('[data-save-product="${p1}"]').getAttribute('aria-pressed') === 'true'`,
      ),
    );
    await evaluate(
      `document.querySelector('[data-save-product="${p2}"]').click()`,
    );
    await waitFor(
      `!!document.querySelector('[aria-label="Open wishlist, 2 saved items"]')`,
    );
    await visit("/wishlist");
    await ready();
    await send("Page.reload");
    await ready();
    check(
      "wishlist survives reload with two products",
      await evaluate(
        `document.querySelectorAll('[data-saved-id]').length === 2`,
      ),
    );
    await evaluate(
      `document.querySelector('[data-saved-id="${p2}"] .remove-saved').click()`,
    );
    await waitFor(`!document.querySelector('[data-saved-id="${p2}"]')`);
    check(
      "wishlist remove updates header count",
      await evaluate(
        `!!document.querySelector('[aria-label="Open wishlist, 1 saved items"]')`,
      ),
    );
    await visit(`/products/${p2}`);
    check(
      "detail save control follows wishlist removal",
      await evaluate(
        `document.querySelector('[data-save-product="${p2}"]').getAttribute('aria-pressed') === 'false'`,
      ),
    );
    await waitFor(
      `!document.querySelector('.product-actions > button').disabled`,
    );
    await evaluate(
      `document.querySelector('.product-actions > button').click()`,
    );
    await waitFor(`!!document.querySelector('[aria-label="Shopping cart"]')`);
    await evaluate(`document.querySelector('#cart-close-btn').click()`);
    await visit("/cart");
    await ready();
    check(
      "mixed cart groups by actual seller ID",
      await evaluate(
        `document.querySelectorAll('[data-cart-seller]').length === 2 && !!document.querySelector('[data-cart-seller="${sellerA}"]') && !!document.querySelector('[data-cart-seller="${sellerB}"]')`,
      ),
    );
    for (const [seller, productId, recipient] of [
      [sellerA, p1, "12025550101"],
      [sellerB, p2, "12025550102"],
    ]) {
      await evaluate(
        `document.querySelector('[data-checkout-seller="${seller}"] button').click()`,
      );
      await waitFor(
        `!!document.querySelector('[data-checkout-link="${seller}"]')`,
      );
      const href = await evaluate(
        `document.querySelector('[data-checkout-link="${seller}"]').href`,
      );
      const link = new URL(href);
      check(
        `seller ${seller} normalized recipient`,
        link.hostname === "wa.me" && link.pathname === "/" + recipient,
      );
      const text = link.searchParams.get("text");
      check(
        `seller ${seller} message uses current origin`,
        text.includes(`${base}/products/${productId}`),
      );
      check(
        `seller ${seller} message excludes other seller`,
        !text.includes(productId === p1 ? p2 : p1),
      );
      check(
        `seller ${seller} message contains correct quantity`,
        text.includes(productId === p1 ? "× 2" : "× 1"),
      );
    }
    check(
      "checkout preparation preserves the cart",
      await evaluate(
        `JSON.parse(localStorage.getItem('munshi-cart')).length === 2`,
      ),
    );
    check(
      "handoff explains that buyer must send and no order is recorded",
      await evaluate(
        `document.querySelector('.checkout-explanation').textContent.includes('send the message') && document.querySelector('.checkout-explanation').textContent.includes('No order is recorded')`,
      ),
    );
    await visit(`/products/${p1}`);
    check(
      "product direct chat resolves its actual seller",
      await evaluate(
        `document.querySelector('[data-seller-chat]').href.startsWith('https://wa.me/12025550101?text=')`,
      ),
    );
    check(
      "platform support separately labeled",
      await evaluate(
        `document.querySelector('.platform-support').textContent.includes('platform support') && document.querySelector('.platform-support').href.includes('923460392313')`,
      ),
    );
    await visit(`/seller/${sellerB}`);
    check(
      "store chat resolves the store seller",
      await evaluate(
        `document.querySelector('[data-seller-chat]').href.startsWith('https://wa.me/12025550102?text=')`,
      ),
    );
    await visit(`/products/${p7}`);
    check(
      "invalid approved fixture contact shows unavailable",
      await evaluate(
        `!document.querySelector('[data-seller-chat]') && document.querySelector('.contact-unavailable').textContent.includes('no approved')`,
      ),
    );
    await evaluate(
      `document.querySelector('.product-actions > button').click()`,
    );
    await waitFor(`!!document.querySelector('#cart-close-btn')`);
    await evaluate(`document.querySelector('#cart-close-btn').click()`);
    await visit("/cart");
    await ready();
    check(
      "missing-contact group does not disable eligible groups",
      await evaluate(
        `document.querySelector('[data-checkout-seller="${sellerC}"] button').disabled && !document.querySelector('[data-checkout-seller="${sellerA}"] button').disabled && !document.querySelector('[data-checkout-seller="${sellerB}"] button').disabled`,
      ),
    );
    await evaluate(
      `(() => { const cart=JSON.parse(localStorage.getItem('munshi-cart')); cart.push({id:'${hidden}',product_name:'Inactive saved item',retail_price:100,quantity:9,cartQty:1,seller_id:'${sellerA}',sellers:{id:'${sellerA}',store_name:'Everyday Goods'}});cart.push({id:'${p4}',product_name:'Sold out saved item',retail_price:850,quantity:9,cartQty:1,seller_id:'${sellerB}',sellers:{id:'${sellerB}',store_name:'The Local Edit'}});cart.find(i=>i.id==='${p2}').cartQty=20; localStorage.setItem('munshi-cart',JSON.stringify(cart)); })()`,
    );
    await send("Page.reload");
    await ready();
    check(
      "inactive saved item stays visible but unavailable",
      await evaluate(
        `document.querySelector('[data-saved-id="${hidden}"]').dataset.availability === 'unavailable'`,
      ),
    );
    check(
      "zero-stock item excluded from checkout",
      await evaluate(
        `document.querySelector('[data-saved-id="${p4}"]').dataset.availability === 'unavailable' && document.querySelector('[data-saved-id="${p4}"] input').disabled`,
      ),
    );
    check(
      "stock reduction clamps persisted quantity",
      await evaluate(
        `document.querySelector('[data-saved-id="${p2}"] input').value === '3' && JSON.parse(localStorage.getItem('munshi-cart')).find(i=>i.id==='${p2}').cartQty === 3`,
      ),
    );
    check(
      "stock adjustment has an explicit notice",
      await evaluate(
        `document.querySelector('main').textContent.includes('reduced to match current stock')`,
      ),
    );
    await evaluate(
      `document.querySelector('[data-checkout-seller="${sellerA}"] button').click()`,
    );
    await waitFor(
      `!!document.querySelector('[data-checkout-link="${sellerA}"]')`,
    );
    check(
      "prepared message excludes inactive item and explains exclusion",
      await evaluate(
        `!decodeURIComponent(document.querySelector('[data-checkout-link="${sellerA}"]').href).includes('${hidden}') && document.querySelector('[data-checkout-seller="${sellerA}"]').textContent.includes('1 unavailable item(s) excluded')`,
      ),
    );
    const apiStock = await evaluate(
      `fetch('/api/checkout/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sellerId:'${sellerB}',items:[{id:'${p2}',quantity:4}]})}).then(r=>r.status)`,
    );
    check("server rechecks stock before handoff", apiStock === 409);
    interceptRequest = (params) =>
      send("Fetch.fulfillRequest", {
        requestId: params.requestId,
        responseCode: 503,
        responseHeaders: [{ name: "Content-Type", value: "application/json" }],
        body: Buffer.from(
          JSON.stringify({ error: "Catalog temporarily unavailable" }),
        ).toString("base64"),
      });
    await send("Fetch.enable", {
      patterns: [
        { urlPattern: "*/api/catalog/resolve", requestStage: "Request" },
      ],
    });
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Refresh availability').click()`,
    );
    await waitFor(`!!document.querySelector('[data-availability="error"]')`);
    check(
      "catalog failure preserves all saved items",
      await evaluate(
        `document.querySelectorAll('[data-saved-id]').length === 5 && JSON.parse(localStorage.getItem('munshi-cart')).length === 5`,
      ),
    );
    check(
      "catalog failure shows retry and blocks checkout",
      await evaluate(
        `Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Retry catalog') && Array.from(document.querySelectorAll('.seller-checkout button')).every(b=>b.disabled)`,
      ),
    );
    await send("Fetch.disable");
    interceptRequest = null;
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Retry catalog').click()`,
    );
    await ready();
    check(
      "catalog retry restores eligible groups",
      await evaluate(
        `!document.querySelector('[data-checkout-seller="${sellerA}"] button').disabled`,
      ),
    );
    for (const [label, width, height] of [
      ["desktop", 1440, 1100],
      ["mobile", 390, 844],
    ]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: label === "mobile",
      });
      await visit("/cart");
      await ready();
      check(
        `${label} mixed cart fits viewport`,
        await evaluate(
          `document.documentElement.scrollWidth <= innerWidth + 1`,
        ),
      );
      await screenshot(`${label}-shopping-cart`);
      await visit("/wishlist");
      await ready();
      check(
        `${label} wishlist fits viewport`,
        await evaluate(
          `document.documentElement.scrollWidth <= innerWidth + 1`,
        ),
      );
      await screenshot(`${label}-wishlist`);
    }
    await visit("/cart");
    await ready();
    await evaluate(
      `document.querySelector('[data-saved-id="${hidden}"] .remove-saved').click()`,
    );
    await waitFor(`!document.querySelector('[data-saved-id="${hidden}"]')`);
    check(
      "unavailable cart item can be removed",
      await evaluate(
        `!JSON.parse(localStorage.getItem('munshi-cart')).some(i=>i.id==='${hidden}')`,
      ),
    );
    check(
      "shopping has no browser runtime exceptions",
      exceptions.length === 0,
    );
    await writeFile(
      path.join(out, "shopping-browser-results.json"),
      JSON.stringify({ base, checks: report, exceptions }, null, 2),
    );
    console.log(
      `PASS: ${report.length} shopping browser checks; no WhatsApp links opened or sent.`,
    );
  } else if (process.env.QA_LIVE === "1") {
    const live = JSON.parse(
      await readFile(".qa/live-catalog-probe.json", "utf8"),
    );
    assert.equal(
      live.productsError,
      null,
      "Probe the live catalog before browser QA",
    );
    const product = live.activeProducts[0];
    const sellerA = product.seller_id;
    const sellerB = live.activeProducts.find(
      (p) => p.seller_id !== sellerA,
    ).seller_id;
    for (const [label, width, height] of [
      ["desktop", 1440, 1100],
      ["mobile", 390, 844],
    ]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: label === "mobile",
      });
      for (const [route, name] of [
        ["/", "home"],
        ["/products", "marketplace"],
        ["/seller", "sell"],
        [`/seller/${sellerA}`, "store"],
        [`/products/${product.id}`, "product"],
      ]) {
        await visit(route, "h1, .catalog-error");
        check(
          `live ${label}: ${name} available`,
          await evaluate(
            `!!document.querySelector('h1') && !document.querySelector('.catalog-error')`,
          ),
        );
        check(
          `live ${label}: ${name} is not a fixture`,
          await evaluate(`!document.querySelector('.fixture-banner')`),
        );
        check(
          `live ${label}: ${name} no overflow`,
          await evaluate(
            `document.documentElement.scrollWidth <= window.innerWidth + 1`,
          ),
        );
        await screenshot(`live-${label}-${name}`);
      }
    }
    await visit(`/products?category=${encodeURIComponent(product.category)}`);
    check(
      "live reference product appears in marketplace category",
      (await ids()).includes(product.id),
    );
    await visit(`/seller/${sellerA}`);
    const a = await ids();
    check(
      "live reference product appears in correct store",
      a.includes(product.id),
    );
    check(
      "live store A cards link only to store A",
      await evaluate(
        `Array.from(document.querySelectorAll('.product-seller a')).every(a => a.getAttribute('href') === '/seller/${sellerA}')`,
      ),
    );
    await visit(`/seller/${sellerB}`);
    const b = await ids();
    check(
      "live store B has distinct listings",
      b.length > 0 && b.every((id) => !a.includes(id)),
    );
    check(
      "live store B cards link only to store B",
      await evaluate(
        `Array.from(document.querySelectorAll('.product-seller a')).every(a => a.getAttribute('href') === '/seller/${sellerB}')`,
      ),
    );
    const search = product.product_name.split(/\s+/)[0];
    await visit(
      `/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(product.category)}&sort=price-asc`,
    );
    check(
      "live combined search/category finds reference product",
      (await ids()).includes(product.id),
    );
    check(
      "live price sort is numeric ascending",
      await evaluate(
        `(() => { const prices = Array.from(document.querySelectorAll('.product-price')).map(e => Number(e.textContent.replace(/[^0-9.]/g, ''))); return prices.every((p, i) => i === 0 || p >= prices[i - 1]); })()`,
      ),
    );
    check(
      "live URL selections displayed",
      await evaluate(
        `document.querySelector('.catalog-controls [name="search"]').value === ${JSON.stringify(search)} && document.querySelector('[name="category"]').value === ${JSON.stringify(product.category)}`,
      ),
    );
    const inactive = live.statuses.filter((p) => p.status !== "active");
    for (const row of inactive.slice(0, 2)) {
      await visit(`/products/${row.id}`);
      check(
        `live inactive direct URL ${row.id} excluded`,
        await evaluate(
          `document.querySelector('h1').textContent.includes('isn’t available') && !document.querySelector('.product-info')`,
        ),
      );
    }
    await visit("/products");
    check(
      "live inactive products absent from marketplace",
      (await ids()).every((id) => !inactive.some((p) => p.id === id)),
    );
    check(
      "live inactive products absent from both stores",
      [...a, ...b].every((id) => !inactive.some((p) => p.id === id)),
    );
    await visit(`/products/${product.id}`);
    if (product.image_urls.length > 1) {
      await evaluate(
        `document.querySelector('[aria-label="View image 2"]').click()`,
      );
      check(
        "live gallery changes image",
        await evaluate(
          `document.querySelector('[aria-label="View image 2"]').getAttribute('aria-pressed') === 'true' && document.querySelector('.gallery-count').textContent.startsWith('2 /')`,
        ),
      );
    }
    check(
      "live product seller link uses UUID",
      await evaluate(
        `document.querySelector('.seller-badge').getAttribute('href') === '/seller/${sellerA}'`,
      ),
    );
    const publicContact = product.sellers?.contact_number;
    const contactDigits = typeof publicContact === 'string' && /^[+\d\s().-]+$/.test(publicContact.trim())
      ? publicContact.trim().replace(/[\s().-]/g, '').replace(/^00/, '').replace(/^\+/, '') : '';
    if (/^[1-9]\d{7,14}$/.test(contactDigits)) {
      check(
        'live seller chat uses the approved public contact',
        await evaluate(`document.querySelector('[data-seller-chat]')?.href.startsWith('https://wa.me/${contactDigits}?') === true`),
      );
    } else {
      check(
        'live missing or invalid public contact remains unavailable',
        await evaluate(`!document.querySelector('[data-seller-chat]') && !!document.querySelector('.contact-unavailable')`),
      );
    }
    check('live platform support stays separate from seller contact', await evaluate(`!!document.querySelector('.platform-support')`));
    check("live no browser runtime exceptions", exceptions.length === 0);
    await writeFile(
      path.join(out, "live-browser-results.json"),
      JSON.stringify({ base, checks: report, exceptions }, null, 2),
    );
    console.log(
      `PASS: ${report.length} live browser checks. Screenshots and report in .qa/`,
    );
  } else {
    const sellerA = "10000000-0000-4000-8000-000000000001";
    const sellerB = "10000000-0000-4000-8000-000000000002";
    const productA = "20000000-0000-4000-8000-000000000001";
    for (const [label, width, height] of [
      ["desktop", 1440, 1100],
      ["mobile", 390, 844],
    ]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: label === "mobile",
      });
      for (const [route, name] of [
        ["/", "home"],
        ["/products", "marketplace"],
        ["/seller", "sell"],
        [`/seller/${sellerA}`, "store"],
        [`/products/${productA}`, "product"],
      ]) {
        await visit(route);
        check(
          `${label}: ${name} fixture banner`,
          await evaluate(`!!document.querySelector('.fixture-banner')`),
        );
        check(
          `${label}: ${name} no horizontal overflow`,
          await evaluate(
            `document.documentElement.scrollWidth <= window.innerWidth + 1`,
          ),
        );
        check(
          `${label}: ${name} renders content`,
          await evaluate(`document.querySelector('h1').textContent.length > 4`),
        );
        await screenshot(`${label}-${name}`);
      }
      await visit(`/products/${productA}`);
      await evaluate(
        `document.querySelector('[aria-label="View image 2"]').click()`,
      );
      check(
        `${label}: gallery changes image`,
        await evaluate(
          `document.querySelector('.gallery-main img').getAttribute('src').includes('tote-detail')`,
        ),
      );
      check(
        `${label}: gallery selected state`,
        await evaluate(
          `document.querySelector('[aria-label="View image 2"]').getAttribute('aria-pressed') === 'true'`,
        ),
      );
    }
    await visit("/products?category=Fashion");
    check(
      "marketplace category contains reference product",
      (await ids()).includes(productA),
    );
    await visit(`/seller/${sellerA}`);
    const a = await ids();
    check(
      "store A contains reference product and only its three products",
      a.includes(productA) && a.length === 3,
    );
    await visit(`/seller/${sellerB}`);
    const b = await ids();
    check(
      "store B is isolated from store A",
      b.length === 3 && b.every((id) => !a.includes(id)),
    );
    await visit("/products?search=canvas&category=Fashion&sort=price-asc");
    check(
      "combined search, category, sort",
      JSON.stringify(await ids()) ===
        JSON.stringify([productA, "20000000-0000-4000-8000-000000000005"]),
    );
    check(
      "URL selections rendered in controls",
      await evaluate(
        `document.querySelector('.catalog-controls [name="search"]').value === 'canvas' && document.querySelector('[name="category"]').value === 'Fashion' && document.querySelector('[name="sort"]').value === 'price-asc'`,
      ),
    );
    await evaluate(
      `document.querySelector('[name="sort"]').value = 'price-desc'; document.querySelector('.catalog-controls').requestSubmit()`,
    );
    await waitFor(
      `location.search.includes('price-desc') && !!document.querySelector('[data-product-id]')`,
    );
    check(
      "form keeps search and category while changing sort",
      await evaluate(
        `new URLSearchParams(location.search).get('search') === 'canvas' && new URLSearchParams(location.search).get('category') === 'Fashion'`,
      ),
    );
    check(
      "descending price order",
      (await ids())[0] === "20000000-0000-4000-8000-000000000005",
    );
    await send("Page.reload");
    await waitFor(
      `document.readyState === 'complete' && !!document.querySelector('[data-product-id]')`,
    );
    check(
      "filtered URL survives refresh",
      (await ids())[0] === "20000000-0000-4000-8000-000000000005",
    );
    await visit(
      `/seller/${sellerA}?category=Fashion&search=canvas&sort=price-desc`,
    );
    check(
      "store filters stay seller-scoped",
      JSON.stringify(await ids()) === JSON.stringify([productA]),
    );
    await visit("/products?search=definitelymissing");
    check(
      "empty search result state",
      await evaluate(
        `!!document.querySelector('.empty-state') && document.querySelectorAll('[data-product-id]').length === 0`,
      ),
    );
    await screenshot("mobile-empty-results");
    await evaluate(`document.querySelector('.mobile-menu-btn').click()`);
    check(
      "mobile navigation opens with accessible state",
      await evaluate(
        `document.querySelector('.mobile-menu-btn').getAttribute('aria-expanded') === 'true' && !!document.querySelector('#mobile-nav')`,
      ),
    );
    await evaluate(
      `document.querySelector('#mobile-nav a[href="/seller"]').click()`,
    );
    await waitFor(
      `location.pathname === '/seller' && !!document.querySelector('.seller-intro')`,
    );
    check(
      "mobile navigation closes after selecting a route",
      await evaluate(`!document.querySelector('#mobile-nav')`),
    );
    await visit("/seller/10000000-0000-4000-8000-000000000003");
    check(
      "known store without active products",
      await evaluate(
        `document.querySelector('h1').textContent.includes('New Shop') && !!document.querySelector('.empty-state')`,
      ),
    );
    await visit("/seller/10000000-0000-4000-8000-000000000099");
    check(
      "unknown store shows not found",
      await evaluate(
        `document.querySelector('h1').textContent.includes('isn’t available')`,
      ),
    );
    for (const suffix of ["000000000099", "000000000098"]) {
      await visit(`/products/20000000-0000-4000-8000-${suffix}`);
      check(
        `direct inactive/legacy product ${suffix} excluded`,
        await evaluate(
          `document.querySelector('h1').textContent.includes('isn’t available') && !document.querySelector('.product-info')`,
        ),
      );
    }
    await visit("/products");
    check(
      "hidden products absent from marketplace",
      (await ids()).every(
        (id) => !id.endsWith("000000000099") && !id.endsWith("000000000098"),
      ),
    );
    await visit("/products/20000000-0000-4000-8000-000000000002");
    check(
      "single-image gallery has no thumbnails",
      await evaluate(
        `!document.querySelector('.gallery-thumbnails') && !!document.querySelector('.gallery-main img')`,
      ),
    );
    await visit("/products/20000000-0000-4000-8000-000000000006");
    check(
      "missing image fallback and unknown stock",
      await evaluate(
        `!!document.querySelector('.missing-image') && document.querySelector('.availability').textContent.includes('confirm availability')`,
      ),
    );
    await visit("/products/20000000-0000-4000-8000-000000000004");
    check(
      "out-of-stock disables add",
      await evaluate(
        `document.querySelector('.product-actions button').disabled`,
      ),
    );
    await visit(`/products/${productA}`);
    check(
      "product links to correct public store",
      await evaluate(
        `document.querySelector('.seller-badge').getAttribute('href') === '/seller/${sellerA}'`,
      ),
    );
    await evaluate(`document.querySelector('.product-actions button').click()`);
    await waitFor(`!!document.querySelector('[aria-label="Shopping cart"]')`);
    check(
      "add to cart opens existing drawer",
      await evaluate(
        `document.querySelector('[aria-label="Shopping cart"]').textContent.includes('Canvas Everyday Tote')`,
      ),
    );
    await evaluate(`document.querySelector('#cart-close-btn').click()`);
    await visit("/cart");
    check(
      "cart keeps item across navigation",
      await evaluate(
        `document.querySelector('main').textContent.includes('Canvas Everyday Tote')`,
      ),
    );
    check(
      "cart has seller-specific checkout without platform order forwarding",
      await evaluate(
        `!!document.querySelector('[data-checkout-seller]') && !document.querySelector('#cart-page-checkout-btn')`,
      ),
    );
    check(
      "cart mobile layout does not overflow",
      await evaluate(
        `document.documentElement.scrollWidth <= window.innerWidth + 1`,
      ),
    );
    await screenshot("mobile-cart");
    await visit(`/seller?seller=${sellerA}&category=Fashion`);
    check(
      "legacy safe seller query redirects to public route",
      await evaluate(
        `location.pathname === '/seller/${sellerA}' && location.search.includes('Fashion')`,
      ),
    );
    await visit("/seller?seller=923460392313");
    check(
      "legacy phone store query never resolves a store",
      await evaluate(
        `!!document.querySelector('.notice') && !document.querySelector('[data-product-id]')`,
      ),
    );
    check("no browser runtime exceptions", exceptions.length === 0);
    await writeFile(
      path.join(out, "browser-results.json"),
      JSON.stringify({ base, checks: report, exceptions }, null, 2),
    );
    console.log(
      `PASS: ${report.length} browser checks. Screenshots and report in .qa/`,
    );
  }
} catch (error) {
  console.error(
    JSON.stringify({
      lastCheck: report.at(-1),
      exceptions,
      diagnostic: await diagnose?.(),
    }),
  );
  throw error;
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id: 999999, method: "Browser.close" }));
    socket.close();
  }
  browser.kill();
}
