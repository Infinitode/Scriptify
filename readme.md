# Scriptify

Scriptify is an AI writing tool designed for authors and creatives. It leverages OpenAI's state-of-the-art Whisper model to deliver near realtime audio transcription — helping you capture your thoughts as you speak.

## Features

- **Near Realtime Transcription:** Convert spoken words into text almost instantly.
- **Intuitive Writing Experience:** Enjoy a clean, distraction-free UI, with extra statistic displays in the information panel.
- **Text Formatting & Exporting:** Scriptify works like most other writing tools, allowing you to format your text, and export in a variety of popular formats.
- **In-app Dictionary:** Look up words quickly and easily without leaving the app with the click of a button.
- **Fun Starter Ideas:** Stuck with writer's block? Scriptify's fun random idea generator contains hundreds of ideas for stories that'll spark your imagination.
- **Auto-backup:** Scriptify will automatically back-up your current file every 10 minutes, making sure that you never lose your writing progress.
- **No Limits:** Scriptify is 100% free, with no limits, or ads.

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

Use your microphone to transcribe your speech into text. Scriptify will automatically transcribe all heard speech text. After transcription, you can manually edit and proofread, or start again.

## Minimum Requirements

Scriptify's minimum requirements will change based on the used Whipser model upon launch.

- Upon launch, Scriptify will ask for you to select a Whisper model to run, these models are saved to the `/models/` directory, for later use.

- Scriptify will then download your chosen model (it may take a while depending on your internet speed), and load it. If you have previously used a model, Scriptify will load it from your file system instead of re-downloading it.

> [!TIP]
> Larger models require more VRAM and computational power to run. If you're not sure which model to pick, we recommend starting with the smallest model and later moving to larger models.

## License & Redistribution

This project is open source. However, it may not be redistributed without significant changes or under the same name. Please refer to the [LICENSE](LICENSE) file for more details on the terms of use.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve Scriptify.

You can read the [CONTRIBUTING](CONTRIBUTING) file for more information and general contribution guidelines.

Happy writing!