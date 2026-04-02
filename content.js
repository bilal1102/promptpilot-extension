// Create button
const button = document.createElement("div");
button.id = "promptpilot-btn";
button.innerText = "✨ Improve";
const DAILY_LIMIT = 10;
const LIVE_URL = `https://promptpilot-server-production.up.railway.app`;
const TEST_URL = `http://localhost:5000`;

document.body.appendChild(button);

// Get active input
function getActiveInput() {
  // 1. Check active element
  const active = document.activeElement;

  if (active) {
    if (active.tagName === "TEXTAREA") return active;

    if (active.isContentEditable) return active;
  }

  // 2. Fallback for ChatGPT specifically
  const chatgptInput = document.querySelector('[contenteditable="true"]');

  if (chatgptInput) return chatgptInput;

  return null;
}


function getUsage() {
  const data = JSON.parse(localStorage.getItem("pp_usage") || "{}");
  const today = new Date().toDateString();

  if (data.date !== today) {
    return { count: 0, date: today };
  }

  return data;
}

function updateUsage() {
  const usage = getUsage();
  usage.count += 1;
  localStorage.setItem("pp_usage", JSON.stringify(usage));
}

function getUserId() {
  let userId = localStorage.getItem("pp_user");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("pp_user", userId);
  }

  return userId;
}

// Click handler
button.onclick = async () => {
  const input = getActiveInput();

  if (!input) {
    alert("Click inside a text field first!");
    return;
  }

  const prompt = input.value || input.innerText;

  if (!prompt) {
    alert("No text found!");
    return;
  }

  // 🔥 ADD LIMIT CHECK HERE
  const usage = getUsage();

 if (usage.count >= DAILY_LIMIT) {
  showUpgradePopup();
  return;
}

  // 🔥 STEP 1: show loading popup
  showPopup("⏳ Improving your prompt...", input, true);

const userId = getUserId();
  try {
    const res = await fetch(`${LIVE_URL}/improve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
       body: JSON.stringify({ prompt, userId })
    });

    const data = await res.json();
    const improved = data.improved || "No response";

    // 🔥 STEP 2: update popup
    updatePopup(improved);

    // ✅ INCREMENT USAGE HERE (after success)
    updateUsage();

  } catch (err) {
    updatePopup("❌ Error improving prompt");
  }
};

function showPopup(text, inputElement, isLoading = false) {
  const old = document.getElementById("promptpilot-popup");
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.id = "promptpilot-popup";

popup.innerHTML = `
  <div id="pp-header" style="cursor: move; font-weight: bold;">
    ✨ PromptPilot
  </div>

  <textarea id="pp-text" ${isLoading ? "disabled" : ""}></textarea>

  <div id="promptpilot-actions">
    <button id="replace-btn" ${isLoading ? "disabled" : ""}>Replace</button>
    <button id="copy-btn" ${isLoading ? "disabled" : ""}>Copy</button>
    <button id="close-btn">Close</button>
  </div>
`;

  document.body.appendChild(popup);

  makeDraggable(popup);

  const textarea = document.getElementById("pp-text");
  textarea.value = text;

  // Replace
  document.getElementById("replace-btn").onclick = () => {
    const newText = textarea.value;

    if (inputElement.tagName === "TEXTAREA") {
      inputElement.value = newText;
    } else {
      inputElement.innerText = newText;
    }

    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    popup.remove();
  };

  // Copy
  document.getElementById("copy-btn").onclick = () => {
    navigator.clipboard.writeText(textarea.value);
  };

  // Close
  document.getElementById("close-btn").onclick = () => {
    popup.remove();
  };
}

function makeDraggable(popup) {
  const header = popup.querySelector("#pp-header");

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;

    offsetX = e.clientX - popup.getBoundingClientRect().left;
    offsetY = e.clientY - popup.getBoundingClientRect().top;

    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    popup.style.left = `${e.clientX - offsetX}px`;
    popup.style.top = `${e.clientY - offsetY}px`;

    popup.style.right = "auto"; // important
    popup.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "auto";
  });
}

function updatePopup(newText) {
  const textarea = document.getElementById("pp-text");
  if (!textarea) return;

  textarea.value = newText;
  textarea.disabled = false;

  document.getElementById("replace-btn").disabled = false;
  document.getElementById("copy-btn").disabled = false;
}

function showUpgradePopup() {
  const old = document.getElementById("promptpilot-popup");
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.id = "promptpilot-popup";
  
  // Explicitly set popup background and text color to prevent inheritance issues
  popup.style.backgroundColor = "#ffffff";
  popup.style.color = "#333333";
  popup.style.padding = "15px";
  popup.style.borderRadius = "8px";
  popup.style.border = "1px solid #ccc";
  popup.style.zIndex = "10000";
  popup.style.position = "fixed";

  popup.innerHTML = `
    <div id="pp-header" style="color: #000; margin-bottom: 10px;"><strong>🚫 Limit Reached</strong></div>

    <div style="margin: 10px 0; font-size: 14px; color: #333;">
      You've used all free prompts today.<br/>
      Enter your email to get unlimited access ₹ 20/day. 🚀
    </div>

    <input 
      id="pp-email" 
      type="email" 
      placeholder="Enter your email"
      style="
        width: 100%; 
        padding: 8px; 
        margin-bottom: 10px; 
        background-color: #fff !important; 
        color: #000 !important; 
        border: 1px solid #999;
        box-sizing: border-box;
      "
    />

    <div style="display: flex; gap: 10px;">
      <button id="upgrade-btn" style="background: #007bff; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px;">Unlock Pro</button>
      <button id="close-btn" style="background: #6c757d; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px;">Close</button>
    </div>
  `;

  document.body.appendChild(popup);
  if (typeof makeDraggable === "function") makeDraggable(popup);

  document.getElementById("upgrade-btn").onclick = sendEmailToBackend;
  document.getElementById("close-btn").onclick = () => popup.remove();
}

async function sendEmailToBackend() {
  const email = document.getElementById("pp-email").value;

  if (!email) {
    alert("Please enter email");
    return;
  }

  const userId = getUserId();

  try {
    await fetch(`${LIVE_URL}/collect-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, userId })
    });

    updatePopup("✅ Thanks! We'll notify you about Pro access.");
  } catch (err) {
    alert("Error submitting email");
  }
}
