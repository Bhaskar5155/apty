document.getElementById("toggleAdBlock").addEventListener("click", () => {
    chrome.storage.local.get(["adBlockEnabled"], (result) => {
      let newState = !result.adBlockEnabled;
      chrome.storage.local.set({ adBlockEnabled: newState });
      alert(`Ad Block is now ${newState ? 'ON' : 'OFF'}`);
      chrome.runtime.sendMessage({ action: "toggleAdBlock", enabled: newState });
    });
  });
  

// it will show the stats on time spent on each site
document.getElementById("showStats").addEventListener("click", () => {
  chrome.storage.local.get(["productivityStats"], (result) => {
    let stats = result.productivityStats || {};
    let statsDiv = document.getElementById("stats");
    statsDiv.innerHTML = "<h3>Productivity Stats</h3>";
    if (Object.keys(stats).length > 0) {
      for (let site in stats) {
        statsDiv.innerHTML += `<p>${site}: ${stats[site]} mins</p>`;
      }
    } else {
      statsDiv.innerHTML += "<p>No stats recorded yet.</p>";
    }
  });
});

document.getElementById("saveNote").addEventListener("click", () => {
  let noteText = document.getElementById("noteText").value.trim();
  if (noteText === "") {
    alert("Please enter a note before saving.");
    return;
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = new URL(tabs[0].url).hostname;
    chrome.storage.local.get(["notes"], (result) => {
      let notes = result.notes || {};
      if (!notes[url]) notes[url] = [];
      notes[url].push(noteText);
      chrome.storage.local.set({ notes: notes }, () => {
        document.getElementById("noteText").value = "";
        displayNotes();
      });
    });
  });
});

function displayNotes() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = new URL(tabs[0].url).hostname;
    chrome.storage.local.get(["notes"], (result) => {
      let notes = result.notes || {};
      let notesContainer = document.getElementById("notes");
      notesContainer.innerHTML = "<h3>Saved Notes</h3>";
      if (notes[url] && notes[url].length > 0) {
        notes[url].forEach((note, index) => {
          let noteElement = document.createElement("div");
          noteElement.classList.add("note-item");
          noteElement.innerHTML = `<span>${note}</span> <button class='delete-btn' data-url='${url}' data-index='${index}'>delete</button>`;
          notesContainer.appendChild(noteElement);
        });
      } else {
        notesContainer.innerHTML += "<p>No notes saved for this site.</p>";
      }
      document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", function () {
          let url = this.getAttribute("data-url");
          let index = parseInt(this.getAttribute("data-index"));
          deleteNote(url, index);
        });
      });
    });
  });
}

function deleteNote(url, index) {
  chrome.storage.local.get(["notes"], (result) => {
    let notes = result.notes || {};
    if (notes[url]) {
      notes[url].splice(index, 1);
      if (notes[url].length === 0) {
        delete notes[url];
      }
      chrome.storage.local.set({ notes: notes }, displayNotes);
    }
  });
}

document.addEventListener("DOMContentLoaded", displayNotes);


document.addEventListener("DOMContentLoaded", () => {
  let manageTabsBtn = document.getElementById("manageTabs");
  let toggleManageTabsBtn = document.getElementById("toggleManageTabs");

  chrome.storage.local.get(["manageTabsEnabled"], (result) => {
    if (result.manageTabsEnabled) {
      manageTabsBtn.disabled = false;
    } else {
      manageTabsBtn.disabled = true;
    }
  });

  toggleManageTabsBtn.addEventListener("click", () => {
    chrome.storage.local.get(["manageTabsEnabled"], (result) => {
      let newState = !result.manageTabsEnabled;
      chrome.storage.local.set({ manageTabsEnabled: newState }, () => {
        manageTabsBtn.disabled = !newState;
        toggleManageTabsBtn.textContent = newState ? "Disable Tab Management" : "Enable Tab Management";
      });
    });
  });

  document.getElementById("manageTabs").addEventListener("click", () => {
    chrome.tabs.query({}, (tabs) => {
      let groupedTabs = {
        "Social Media": [],
        "Work": [],
        "News": [],
        "Others": []
      };

      tabs.forEach(tab => {
        if (tab.url.includes("facebook.com") || tab.url.includes("twitter.com") || tab.url.includes("instagram.com") || tab.url.includes("youtube.com")) {
          groupedTabs["Social Media"].push(tab.id);
        } else if (tab.url.includes("docs.google.com") || tab.url.includes("slack.com") || tab.url.includes("github.com")) {
          groupedTabs["Work"].push(tab.id);
        } else if (tab.url.includes("cnn.com") || tab.url.includes("bbc.com") || tab.url.includes("nytimes.com")) {
          groupedTabs["News"].push(tab.id);
        } else {
          groupedTabs["Others"].push(tab.id);
        }
      });

      Object.keys(groupedTabs).forEach(category => {
        if (groupedTabs[category].length > 0) {
          chrome.tabs.group({ tabIds: groupedTabs[category] });
        }
      });
    });
  });

  document.getElementById("resetTabs").addEventListener("click", () => {
    chrome.tabs.query({}, (tabs) => {
      let tabIds = tabs.map(tab => tab.id);
      chrome.tabs.ungroup(tabIds);
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const filterInput = document.getElementById("customFilter");
  const addFilterBtn = document.getElementById("addFilter");
  const filterList = document.getElementById("filters");
  const filterCount = document.getElementById("filterCount");

  // Check if elements exist before running the script
  if (!filterInput || !addFilterBtn || !filterList || !filterCount) {
    console.error("Error: One or more filter-related elements are missing from popup.html.");
    return;
  }

  // Function to update the displayed filter list
  function updateFilterDisplay(filters) {
    filterList.innerHTML = ""; // Clear previous filters
    filters.forEach((filter, index) => {
      let filterItem = document.createElement("div");
      filterItem.innerHTML = `
        <span>${filter}</span> 
        <button class="delete-filter" data-index="${index}">❌</button>
      `;
      filterList.appendChild(filterItem);
    });

    // Update the count of filters
    filterCount.textContent = filters.length;

    // Add delete functionality
    document.querySelectorAll(".delete-filter").forEach(button => {
      button.addEventListener("click", function () {
        let index = parseInt(this.getAttribute("data-index"));
        removeFilter(index);
      });
    });
  }

  // Load existing filters when the popup opens
  chrome.storage.local.get(["customFilters"], (result) => {
    let filters = result.customFilters || [];
    updateFilterDisplay(filters);
  });

  // Event listener for adding new filters
  addFilterBtn.addEventListener("click", () => {
    let filter = filterInput.value.trim();
    if (!filter) {
      alert("Please enter a valid domain or keyword.");
      return;
    }

    chrome.storage.local.get(["customFilters"], (result) => {
      let filters = result.customFilters || [];
      if (filters.includes(filter)) {
        alert("This filter is already added!");
        return;
      }

      filters.push(filter); // Add new filter
      chrome.storage.local.set({ customFilters: filters }, () => {
        updateFilterDisplay(filters); // Refresh the displayed filters
        alert("Filter added successfully!");
      });
    });

    filterInput.value = ""; // Clear input field
  });

  // Function to remove a filter
  function removeFilter(index) {
    chrome.storage.local.get(["customFilters"], (result) => {
      let filters = result.customFilters || [];
      if (index >= 0 && index < filters.length) {
        filters.splice(index, 1); // Remove filter by index
        chrome.storage.local.set({ customFilters: filters }, () => {
          updateFilterDisplay(filters); // Refresh UI after deletion
        });
      }
    });
  }
});



