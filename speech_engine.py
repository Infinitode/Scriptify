"""Whisper model catalog and ONNX Runtime inference helpers.

Models are downloaded on demand as int8 ONNX graphs and kept separately from
Scriptify's executable, so shipping the app never bundles model weights.
"""

from pathlib import Path
import shutil


MODEL_CATALOG = {
    "tiny.en": {
        "repository": "onnx-community/whisper-tiny.en",
        "language": "en",
        "download_size": "~45 MB",
        "description": "Fastest · English",
    },
    "base.en": {
        "repository": "onnx-community/whisper-base.en",
        "language": "en",
        "download_size": "~80 MB",
        "description": "Lightweight · English",
    },
    "small.en": {
        "repository": "onnx-community/whisper-small.en",
        "language": "en",
        "download_size": "~250 MB",
        "description": "Balanced · English",
    },
    "medium.en": {
        "repository": "Xenova/whisper-medium.en",
        "language": "en",
        "download_size": "~850 MB",
        "description": "Higher accuracy · English",
    },
    "large": {
        "repository": "onnx-community/whisper-large-v3-ONNX",
        "language": None,
        "download_size": "~2 GB",
        "description": "Highest accuracy · multilingual",
    },
    "turbo": {
        "repository": "onnx-community/whisper-large-v3-turbo",
        "language": None,
        "download_size": "~1 GB",
        "description": "Fast · multilingual",
    },
}

QUANTIZATION = "int8"


def _has_complete_quantized_model(model_directory: Path) -> bool:
    """Whether a previous download contains every file needed by Whisper."""
    required_metadata = ("config.json", "vocab.json", "added_tokens.json")
    if any(not (model_directory / filename).is_file() for filename in required_metadata):
        return False

    encoder_found = any(
        path.name == "encoder_model_int8.onnx"
        for path in model_directory.rglob("encoder_model_int8.onnx")
    )
    decoder_found = any(
        path.name == "decoder_model_merged_int8.onnx"
        for path in model_directory.rglob("decoder_model_merged_int8.onnx")
    )
    return encoder_found and decoder_found


def load_model(model_name: str, models_directory: str | Path):
    """Download if needed, then load a quantized Whisper model through ONNX Runtime."""
    if model_name not in MODEL_CATALOG:
        raise ValueError(f"Unknown Whisper model: {model_name}")

    # Import lazily so opening the writing studio does not initialize ONNX
    # Runtime until a transcription model has been selected.
    import onnx_asr

    model_directory = Path(models_directory) / model_name
    Path(models_directory).mkdir(parents=True, exist_ok=True)

    # Clear a partial prior download before resolving the repository. An
    # existing directory otherwise signals offline mode to onnx-asr.
    if model_directory.is_dir() and not _has_complete_quantized_model(model_directory):
        shutil.rmtree(model_directory, ignore_errors=True)

    try:
        return onnx_asr.load_model(
            MODEL_CATALOG[model_name]["repository"],
            path=model_directory,
            quantization=QUANTIZATION,
        )
    except Exception:
        # A cancelled/failed first download leaves a local directory behind.
        # onnx-asr treats an existing local directory as an offline model, so
        # remove only incomplete downloads to let the next launch retry cleanly.
        if model_directory.is_dir() and not _has_complete_quantized_model(model_directory):
            shutil.rmtree(model_directory, ignore_errors=True)
        raise


def transcribe(model, model_name: str, waveform, sample_rate: int = 16_000) -> str:
    """Transcribe one normalized mono audio chunk using the selected model."""
    if model_name not in MODEL_CATALOG:
        raise ValueError(f"Unknown Whisper model: {model_name}")

    options = {}
    language = MODEL_CATALOG[model_name]["language"]
    if language:
        # English-only checkpoints can skip Whisper's language-detection pass.
        options["language"] = language

    text = model.recognize(waveform, sample_rate=sample_rate, **options)
    return str(text or "").strip()
