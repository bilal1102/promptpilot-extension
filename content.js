// Create button
const button = document.createElement("div");
button.id = "promptpilot-btn";
button.innerText = "✨ Improve";
const DAILY_LIMIT = 10;

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
    showPopup(
      "🚫 Free limit reached.\n\nUpgrade to Pro for unlimited prompts 🚀",
      null
    );
    return;
  }

  // 🔥 STEP 1: show loading popup
  showPopup("⏳ Improving your prompt...", input, true);

  try {
    const res = await fetch("http://localhost:5000/improve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
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
    <div><strong>✨ PromptPilot</strong></div>
    <textarea id="pp-text" ${isLoading ? "disabled" : ""}></textarea>

    <div id="promptpilot-actions">
      <button id="replace-btn" ${isLoading ? "disabled" : ""}>Replace</button>
      <button id="copy-btn" ${isLoading ? "disabled" : ""}>Copy</button>
      <button id="close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(popup);

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

function updatePopup(newText) {
  const textarea = document.getElementById("pp-text");
  if (!textarea) return;

  textarea.value = newText;
  textarea.disabled = false;

  document.getElementById("replace-btn").disabled = false;
  document.getElementById("copy-btn").disabled = false;
}
