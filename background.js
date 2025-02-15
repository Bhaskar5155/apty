chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ adBlockEnabled: false, productivityStats: {}, customFilters: [], notes: {} });
});
// it will record the time spent on each site.
chrome.webNavigation.onCompleted.addListener((details) => {
  chrome.storage.local.get(["productivityStats"], (result) => {
    let stats = result.productivityStats || {};
    let domain = new URL(details.url).hostname;
    stats[domain] = (stats[domain] || 0) + 1;
    chrome.storage.local.set({ productivityStats: stats });
  });
});

// Function to update ad blocking rules dynamically
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ adBlockEnabled: false, customFilters: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleAdBlock") {
    chrome.storage.local.set({ adBlockEnabled: message.enabled }, () => {
      updateAdBlockingRules();
    });
  } else if (message.action === "updateFilters") {
    updateAdBlockingRules();
  }
});

function updateAdBlockingRules() {
  chrome.storage.local.get(["adBlockEnabled", "customFilters"], (result) => {
    let enabled = result.adBlockEnabled;
    let filters = result.customFilters || [];

    let rules = [
      {
        id: 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "*://*.doubleclick.net/*",
          resourceTypes: ["script", "xmlhttprequest"]
        }
      },
      {
        id: 2,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "*://*.googlesyndication.com/*",
          resourceTypes: ["script", "image", "xmlhttprequest"]
        }
      }
    ];

    // Add user-defined custom filters dynamically
    filters.forEach((filter, index) => {
      rules.push({
        id: 100 + index,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: `*://*${filter}*`,
          resourceTypes: ["script", "image", "xmlhttprequest"]
        }
      });
    });

    if (enabled) {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(r => r.id),
        addRules: rules
      });
    } else {
      chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: rules.map(r => r.id) });
    }
  });
}
