# Scriptify

Scriptify is an AI writing tool designed for authors and creatives. It uses quantized Whisper models with ONNX Runtime for near-real-time, on-device transcription, helping you capture your thoughts as you speak without sending audio to a transcription service.

Visit our website for screenshots/minimum requirements, and supported platforms: https://infinitode.netlify.app/apps/scriptify.

## Features

- **Near Realtime Transcription:** Convert spoken words into text almost instantly.
- **Focused Writing Studio:** A calmer editor with accessible formatting tools, and a dedicated reading mode with adjustable text size, reading progress, and a persistent light/dark page theme.
- **Richer Formatting & Exporting:** Use multiple heading levels, quotes, lists, and inline styles, then export your work in popular formats with structure preserved.
- **Useful Writing Statistics:** Track word and character counts, reading time, sentence and paragraph counts, vocabulary variety, and estimated readability.
- **In-app Dictionary:** Look up selected words quickly without leaving the editor.
- **Ideas & Starting Thoughts:** Browse hundreds of story prompts or get a first line to help move past a blank page. Add an opening thought to your draft with one click.
- **Automatic Story Library:** Drafts are saved to your per-user application data as you write, then appear in the sidebar and full-screen library the next time you open Scriptify. Browse start and edit dates, rename, copy, or delete stories.
- **Autosave & Backup:** The active story is saved automatically, the in-app close button waits for pending saves, and a recovery copy protects recent edits if the app exits unexpectedly. A separate desktop safety snapshot is also created every 10 minutes.
- **No Limits:** Scriptify is 100% free, with no limits or ads.

## Current development

- Replaced the PyTorch/OpenAI Whisper runtime with ONNX Runtime and int8 Whisper graphs. Model weights download on demand and stay outside the application bundle.
- Simplified the model chooser and made its download status honest: the downloader does not expose byte-level progress, so the UI uses an indeterminate indicator instead of fabricated percentages.
- Added a saved light/dark page preference to reading mode.
- Kept the existing editor, story library, backups, formatting, exports, writing statistics, dictionary, and microphone workflow.

## Changelog `v1.2.0-beta`:

- Refreshed the writing studio with reading mode, writing metrics, formatting tools, and inspiration prompts.
- Added an automatically saved story library with desktop application-data storage and a browser local-storage fallback.

## Changelog `v1.0.0-beta`:

- Created a launch window for model selection and downloads.
- Modified transcription logic to allow for "real-time" audio transcription by recording the audio in chunks and then processing it in the background.
- Introduced windowed modes for all platforms (no console windows).
- Updated UI with animations and new shortcuts.
- A ton of bug fixes, including fixing `ffmpeg` extraction, openai-whisper hidden imports and files, and file path fixes.
- Several export formats have been added, though there are some issues with `<h2>` headings.
- Added an `information panel` for writing statistics.

> [!IMPORTANT]
> Whisper model files are downloaded separately on first use and are not embedded in the release executable. The build bundles ONNX Runtime for CPU inference; final artifact sizes should be checked from the platform build workflow.

> [!NOTE]
> Releases for Scriptify will not be included in [Distributables](https://github.com/Infinitode/Distributables) since the release binaries are already distributed here.

## Installation (from source)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Infinitode/Scriptify.git
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run Scriptify:**
   ```bash
   python main.py
   ```

## Installation (releases)

1. **Download the release binary for your platform:**
Head to the releases. Select the latest release. Download the latest release binary for your platform.

2. **Run Scriptify:**
Run the Scriptify application file.

## Usage

- On first launch, choose one of the six Whisper sizes. Scriptify downloads only the selected int8 ONNX model into `models/<model-name>/` beside the application; larger models take more storage and memory.
- The first download requires an internet connection and may take a while. Cached models are loaded locally on later launches, and microphone audio is processed on-device.
- The writing studio opens after the selected model is ready. You can write normally or dictate into the current draft; use the reading-mode controls to select a light or dark page.
- Your current story is saved automatically. Use **Recent stories** in the sidebar to resume, rename, duplicate, or remove drafts; **All stories** opens the full library.
- Use Export or Save draft when you want a separate file to share or archive. Scriptify also creates a desktop safety backup every 10 minutes.

Automatic story files are kept in Scriptify's per-user application data folder:

- Windows: `%APPDATA%/Scriptify/stories`
- macOS: `~/Library/Application Support/Scriptify/stories`
- Linux: `$XDG_DATA_HOME/Scriptify/stories`, or `~/.local/share/Scriptify/stories`

When running in a regular browser rather than the desktop app, the library uses that browser's local storage for the current site.

## Minimum Requirements

- A supported desktop operating system and audio input device.
- An internet connection for the initial model download; cached models can be used offline afterward.
- At least 2 GB of RAM for the smallest model. More RAM and disk space are recommended for medium, large, and turbo models.
- A CPU with AVX2 is recommended on x86-64 systems; a GPU is optional. The bundled runtime uses ONNX Runtime's CPU execution provider by default.

> [!TIP]
> If you are unsure which model to choose, start with Tiny or Base. You can switch models on a later launch; each selected model is cached separately in `models/`.

## License & Redistribution

This project is open source. However, it may not be redistributed without significant changes or under the same name. Please refer to the [LICENSE](LICENSE) file for more details on the terms of use.

Scriptify bundles a few third-party assets so the interface renders without an internet connection:

- [Bootstrap Icons](https://icons.getbootstrap.com/) — MIT licence, in `web/vendor/bootstrap-icons/`.
- [Inter](https://rsms.me/inter/) and [Literata](https://fonts.google.com/specimen/Literata) variable fonts — SIL Open Font License 1.1, in `web/fonts/`.

Each asset's licence is kept alongside the files it covers.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve Scriptify. You can read the [CONTRIBUTING](CONTRIBUTING) file for more information and general contribution guidelines.

Happy writing!
