# Scriptify

Scriptify is an AI writing tool designed for authors and creatives. It leverages OpenAI's state-of-the-art Whisper model to deliver near-real-time audio transcription, helping you capture your thoughts as you speak.

## Features

- **Near Realtime Transcription:** Convert spoken words into text almost instantly.
- **Intuitive Writing Experience:** Enjoy a clean, distraction-free UI, with extra statistic displays in the information panel.
- **Text Formatting & Exporting:** Scriptify works like most other writing tools, allowing you to format your text and export in various popular formats.
- **In-app Dictionary:** Look up words quickly and easily without leaving the app with the click of a button.
- **Fun Starter Ideas:** Stuck with writer's block? Scriptify's fun random idea generator contains hundreds of ideas for stories that'll spark your imagination.
- **Auto-backup:** Scriptify will automatically back-up your current file every 10 minutes, making sure that you never lose your writing progress.
- **No Limits:** Scriptify is 100% free, with no limits or ads.

## Changelog `v1.0.0-beta`:

- Created a launch window for model selection and downloads.
- Modified transcription logic to allow for "real-time" audio transcription by recording the audio in chunks and then processing it in the background.
- Introduced windowed modes for all platforms (no console windows).
- Updated UI with animations and new shortcuts.
- A ton of bug fixes, including fixing `ffmpeg` extraction, openai-whisper hidden imports and files, and file path fixes.
- Several export formats have been added, though there are some issues with `<h2>` headings.
- Added an `information panel` for writing statistics.

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
- You can export or save your work for later use. Scriptify will also automatically create backups of your work every so often, so you never lose your work.

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

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve Scriptify. You can read the [CONTRIBUTING](CONTRIBUTING) file for more information and general contribution guidelines.

Happy writing!
