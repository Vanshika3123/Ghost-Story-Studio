const MODEL_ID = "onnx-community/SmolLM2-360M-ONNX";
const TRANSFORMERS_CDN =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

const form = document.querySelector("#storyForm");
const placeInput = document.querySelector("#place");
const keepsakeInput = document.querySelector("#keepsake");
const moodInput = document.querySelector("#mood");
const modelToggle = document.querySelector("#useModel");
const modelStatus = document.querySelector("#modelStatus");
const modelNote = document.querySelector("#modelNote");
const content = document.querySelector("#storyContent");
const panel = document.querySelector(".story-panel");
const button = document.querySelector("#generateButton");
const buttonText = document.querySelector("#buttonText");
const modeLabel = document.querySelector("#modeLabel");
const storyMeta = document.querySelector("#storyMeta");
const storyNumber = document.querySelector("#storyNumber");
const copyButton = document.querySelector("#copyButton");

let generatorPromise;
let storyCount = 0;
let currentStory = "";

const templates = [
  (place, item) =>
    `At ${place}, the last train had been gone for years. Still, each night, the little ${item} began to play just before the clock struck twelve.

Mara followed its thin melody down the empty platform. In the window of the waiting room, someone stood behind her reflection—wearing the coat her grandmother had been buried in.

The music stopped. A warm hand touched Mara’s shoulder, and a voice she almost remembered whispered, “You found your way home.” At dawn, the ${item} was quiet. Its tiny door stood open.`,

  (place, item) =>
    `The caretaker at ${place} kept the ${item} in a drawer and never spoke of it. Visitors said it belonged to a child who vanished on a rainy Thursday.

One evening, the lights flickered. A small voice called from the hallway, asking if anyone had seen the way back. The caretaker opened the drawer. The ${item} was still there, but it was warm.

Outside, the rain had stopped. On the glass, a little handprint appeared—then slowly faded, as if someone had finally waved goodbye.`,

  (place, item) =>
    `There was one rule at ${place}: leave the ${item} where you found it. Nobody knew who made the rule. Nobody dared to break it.

When the new groundskeeper carried it home, the wind followed. At midnight, three soft knocks came from inside the walls. Then a whisper: “I was looking for that.”

By morning, the ${item} had returned to its place. Beside it lay a fresh flower, still bright with dew.`
];

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function fallbackStory(place, item) {
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template(place, item);
}

async function getGenerator() {
  if (!generatorPromise) {
    generatorPromise = import(TRANSFORMERS_CDN)
      .then(({ pipeline, env }) => {
        env.allowLocalModels = false;
        return pipeline("text-generation", MODEL_ID, { dtype: "q4" });
      })
      .catch((error) => {
        generatorPromise = undefined;
        throw error;
      });
  }

  return generatorPromise;
}

async function makeModelStory(place, keepsake, mood) {
  const pipe = await getGenerator();

  const prompt =
    `Write one original short ghost story in 3 paragraphs, under 150 words. ` +
    `Mood: ${mood}. Setting: ${place}. Important object: ${keepsake}. ` +
    `Use gentle suspense and a satisfying, humane ending. ` +
    `Do not include a title or explain your choices.`;

  const result = await pipe(prompt, {
    max_new_tokens: 190,
    do_sample: true,
    temperature: 0.85,
    repetition_penalty: 1.12
  });

  const generated = result?.[0]?.generated_text;
  const story =
    typeof generated === "string"
      ? generated.slice(prompt.length).trim()
      : "";

  if (!story) {
    throw new Error("The model returned an empty story.");
  }

  return story;
}

function showStory(story, mode) {
  currentStory = story;

  const paragraphs = story.split(/\n\s*\n/).filter(Boolean);
  content.innerHTML = `
    <div class="story-text">
      ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </div>
  `;

  storyCount += 1;
  storyNumber.textContent = String(storyCount).padStart(3, "0");

  storyMeta.textContent =
    mode === "model"
      ? "Written in your browser · open model"
      : "Written in your browser · offline fallback";

  modeLabel.textContent =
    mode === "model"
      ? "OPEN MODEL · ON DEVICE"
      : "LOCAL STORY MODE";
}

function setBusy(busy, message = "Working…") {
  button.disabled = busy;
  buttonText.textContent = busy ? message : "Make a story";
  panel.setAttribute("aria-busy", String(busy));
}

modelToggle.addEventListener("change", () => {
  const enabled = modelToggle.checked;

  modeLabel.textContent = enabled
    ? "OPEN MODEL READY TO LOAD"
    : "LOCAL STORY MODE";

  modelStatus.textContent = enabled
    ? "Open weights · first use downloads the model"
    : "Optional · downloads once, then stays in your browser cache";

  modelNote.textContent = enabled
    ? "First use needs internet and a large one-time model download (around 300–500 MB). Inference then runs on your device; speed depends on your browser and hardware."
    : "The optional model needs internet for its first download (around 300–500 MB) and a modern browser. No API key or account.";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const place = placeInput.value.trim() || "a quiet old house";
  const keepsake = keepsakeInput.value.trim() || "a silver key";
  const mood = moodInput.value;

  setBusy(true, modelToggle.checked ? "Waking the model…" : "Listening…");

  content.innerHTML = `
    <p class="progress-label">
      ${modelToggle.checked
        ? "The model may need a moment on first use…"
        : "A story is gathering…"}
    </p>
  `;

  if (modelToggle.checked) {
    modelStatus.textContent =
      "Loading model · this can take a few minutes the first time";

    try {
      const story = await makeModelStory(place, keepsake, mood);
      showStory(story, "model");
      modelStatus.textContent = "Model ready · cached by your browser";
    } catch (error) {
      console.warn("Open model unavailable; using local story fallback.", error);
      showStory(fallbackStory(place, keepsake), "fallback");
      modelStatus.textContent =
        "Model could not load · showing a local story instead";
    }
  } else {
    await new Promise((resolve) => window.setTimeout(resolve, 280));
    showStory(fallbackStory(place, keepsake), "fallback");
  }

  setBusy(false);
});

copyButton.addEventListener("click", async () => {
  if (!currentStory) {
    storyMeta.textContent = "Make a story first";
    return;
  }

  try {
    await navigator.clipboard.writeText(currentStory);
    storyMeta.textContent = "Story copied to clipboard";
  } catch {
    storyMeta.textContent = "Clipboard unavailable in this browser";
  }
});