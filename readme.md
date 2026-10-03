# Scriptify

Scriptify is an AI writing tool designed for authors and creatives. It leverages OpenAI's state-of-the-art Whisper model to deliver near-real-time audio transcription, helping you capture your thoughts as you speak.

Visit our website for screenshots/minimum requirements, and supported platforms: https://infinitode.netlify.app/apps/scriptify.

## Features

- **Near Realtime Transcription:** Convert spoken words into text almost instantly.
- **Focused Writing Studio:** A refreshed editor with a calmer layout, accessible formatting tools, and a dedicated reading mode with adjustable text size and reading progress.
- **Richer Formatting & Exporting:** Use multiple heading levels, quotes, lists, and inline styles, then export your work in popular formats with structure preserved.
- **Useful Writing Statistics:** Track word and character counts, reading time, sentence and paragraph counts, vocabulary variety, and estimated readability.
- **In-app Dictionary:** Look up selected words quickly without leaving the editor.
- **Ideas & Starting Thoughts:** Browse hundreds of story prompts or get a first line to help move past a blank page. Add an opening thought to your draft with one click.
- **Automatic Story Library:** Drafts are saved to your per-user application data as you write, then appear in the sidebar and full-screen library the next time you open Scriptify. Browse start and edit dates, rename, copy, or delete stories.
- **Autosave & Backup:** The active story is saved automatically, with a separate desktop safety snapshot every 10 minutes.
- **No Limits:** Scriptify is 100% free, with no limits or ads.

## Changelog `v1.2.1-beta`:

- Rebuilt the startup window so it matches the writing studio: model cards with download size, VRAM and speed, and a progress bar that reports real download progress.
- Bundled the icon font and typefaces with the app, so the interface renders correctly without an internet connection.
- Fixed the writing desk's horizontal padding and aligned the page heading with the page itself.
- Reworked the recent-stories rows in the sidebar — rename, duplicate and delete now open in a menu that is no longer clipped by the sidebar.
- Tidied the interface's type scale and spacing so the small labels stay legible and consistent.

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
> **For Linux/Ubuntu users:**  
> The release binary is split into multiple zip files due to GitHub's size constraints. We've tried to reduce the file size during and after build as much as possible, but we could not get it below 2GB which is the maximum allowed for releases. You can download all the parts of the binary and use **7-Zip (`p7zip-full`)** or **unzip (`unzip`)** to unzip the files.
>
> Using 7-Zip:
> ```bash
> sudo apt-get install p7zip-full
> ```
> ```bash
> 7z x scriptify_ubuntu_v1_2_0_beta.zip
> ```

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

- Upon launch, Scriptify will ask you to select a Whisper model to run. These models are saved to the `/models/` directory for later use, with larger models needing more computational power to run.
- Scriptify will then download your chosen model (it may take a while depending on your internet speed) and load it. If you have previously used a model, Scriptify will load it from your file system instead of re-downloading it.
- After downloading, the model will be loaded, and you will be redirected to the Scriptify editor, where you can type or transcribe your speech. Scriptify works just like any other writing tool, with the added benefit of real-time audio transcription.
- Your current story is saved automatically. Use **Recent stories** in the sidebar to resume, rename, duplicate, or remove drafts; **All stories** opens the full library.
- Use Export or Save draft when you want a separate file to share or archive. Scriptify also creates a desktop safety backup every 10 minutes.

Automatic story files are kept in Scriptify's per-user application data folder:

- Windows: `%APPDATA%/Scriptify/stories`
- macOS: `~/Library/Application Support/Scriptify/stories`
- Linux: `$XDG_DATA_HOME/Scriptify/stories`, or `~/.local/share/Scriptify/stories`

When running in a regular browser rather than the desktop app, the library uses that browser's local storage for the current site.

> [!NOTE]
> Scriptify might take a while to launch. It has to first extract `ffmpeg` on your system to work properly. After extraction, the model selector window will launch.

## Minimum Requirements

- RAM: 2GB
- VRAM: 1GB
- Storage space: 2GB
- GPU: Optional (for larger models, more powerful GPUs)
- CPU: 2 Core CPU

> [!NOTE]
> These are the minimum requirements for running the smallest and fastest Whisper model. Larger models require more storage space, VRAM, and processing power in order to run properly.

> [!TIP]
> Larger models require more VRAM and computational power to run. If you're not sure which model to pick, we recommend starting with the smallest model and later moving to larger models.

## License & Redistribution

This project is open source. However, it may not be redistributed without significant changes or under the same name. Please refer to the [LICENSE](LICENSE) file for more details on the terms of use.

Scriptify bundles a few third-party assets so the interface renders without an internet connection:

- [Bootstrap Icons](https://icons.getbootstrap.com/) — MIT licence, in `web/vendor/bootstrap-icons/`.
- [Inter](https://rsms.me/inter/) and [Literata](https://fonts.google.com/specimen/Literata) variable fonts — SIL Open Font License 1.1, in `web/fonts/`.

Each asset's licence is kept alongside the files it covers.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve Scriptify. You can read the [CONTRIBUTING](CONTRIBUTING) file for more information and general contribution guidelines.

Happy writing!
