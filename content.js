
//it remove the adds if add blocker enabled 
chrome.storage.local.get(["adBlockEnabled", "customFilters"], (result) => {
if (result.adBlockEnabled) {
    let observer = new MutationObserver(() => {
    document.querySelectorAll(".ad-banner, .ad-container, iframe[src*='ads']").forEach(el => el.remove());
    result.customFilters.forEach(filter => {
        if (document.location.hostname.includes(filter)) {
        document.body.innerHTML = "";
        }
    });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
});
chrome.storage.local.get(["notes"], (result) => {
    let notes = result.notes || {};
    let url = window.location.hostname;

    if (notes[url] && notes[url].length > 0) {
        let noteContainer = document.createElement("div");
        noteContainer.style.position = "fixed";
        noteContainer.style.bottom = "10px";
        noteContainer.style.right = "10px";
        noteContainer.style.background = "white";
        noteContainer.style.color = "black";
        noteContainer.style.padding = "10px";
        noteContainer.style.border = "1px solid #ccc";
        noteContainer.style.borderRadius = "5px";
        noteContainer.style.boxShadow = "0px 0px 5px rgba(0,0,0,0.2)";
        noteContainer.innerHTML = `<h3>Your Notes</h3><p>${notes[url].join("<br>")}</p>`;

        document.body.appendChild(noteContainer);
    }
});
function removeYouTubeAds() {
    const adSelectors = [
      ".ytp-ad-module", // Video ad container
      ".video-ads", // Pre-roll ads
      ".ytp-ad-player-overlay", // Overlay ads
      ".ytp-ad-text", // Ad text elements
      "#player-ads", // Ad player container
      ".ad-showing", // Remove ad UI state
      ".ytp-ad-image", // Ad images
      ".ytp-ad-overlay-image", // Overlay image ads
      "ytd-promoted-video-renderer", // Promoted video ads
      "ytd-companion-slot-renderer" // Sidebar ads
    ];
  
    adSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(ad => ad.remove());
    });
  
    
  }
  
  // Run YouTube ad remover every second
  setInterval(removeYouTubeAds, 1000);
  function removeAds() {
    const adSelectors = [
      ".ad", ".ads", ".advertisement", // General ad classes
      ".ytp-ad-module", ".video-ads", ".ytp-ad-text", // YouTube ads
      "#player-ads", "#top-banner-ads" // Banner ads
    ];
  
    adSelectors.forEach(selector => {
      let ads = document.querySelectorAll(selector);
      ads.forEach(ad => ad.remove());
    });
  
    // Auto-skip YouTube ads if they appear
    let skipBtn = document.querySelector(".ytp-ad-skip-button");
    if (skipBtn) {
      skipBtn.click();
    }
  }
  
  // Run ad remover every second (to catch dynamic ads)
  setInterval(removeAds, 1000);

  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleAdBlock") {
      chrome.storage.local.set({ adBlockEnabled: message.enabled }, () => {
        updateAdBlockingRules();
      });
    } else if (message.action === "updateFilters") {
      updateAdBlockingRules();
    }
  });
  
  // Function to apply custom ad blocking rules
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
  
      // Add user-defined filters dynamically
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




