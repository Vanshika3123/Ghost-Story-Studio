# The Quiet Signal — Ghost Story Studio

A beginner-friendly ghost story generator made with separate HTML, CSS, and JavaScript files for the Hacktoberfest “Ghost in the Machine” challenge.

## How to run

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Enter a place and a keepsake, choose a mood, then click **Make a story**.

The built-in story mode works without an account, API key, or model download. For best results, run the project through a local web server, such as VS Code Live Server.

## Optional open model

Turn on **Invite the open model** to generate a story with the SmolLM2 360M ONNX model using Transformers.js.

The first model use requires an internet connection and downloads model files to the browser. The download can be large. Once loaded, inference runs in your browser; speed depends on your device. If the model cannot load, the app uses a built-in story instead.

## Privacy and open innovation

Your story prompts are processed in the browser and are not sent to an AI inference server. The model and library are downloaded from public hosting, so the initial model load needs internet. Browser caching may help on later visits, but offline model use is not guaranteed.

Using open model weights avoids a paid API key and lets developers inspect or replace the model. The trade-off is a large first download and performance that varies across devices.

## Files

- `index.html` — page structure
- `style.css` — page styling
- `script.js` — story generator and browser model
- `README.md` — project instructions

## Model

The project uses [SmolLM2 360M ONNX](https://huggingface.co/onnx-community/SmolLM2-360M-ONNX) through [Transformers.js](https://github.com/huggingface/transformers.js). Check their project pages for license details.