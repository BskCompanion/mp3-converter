import { FFmpeg } from "https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js";
import { fetchFile } from "https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js";

const ffmpeg = new FFmpeg();

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const convertBtn = document.getElementById("convertBtn");
const progress = document.getElementById("progress");
const status = document.getElementById("status");
const output = document.getElementById("output");
const bitrateSelect = document.getElementById("bitrate");

let selectedFile = null;

/* ----------------------------
   UI HELPERS
---------------------------- */

function setStatus(text) {
    status.textContent = text;
}

function setProgress(value) {
    progress.value = value * 100;
}

/* ----------------------------
   DRAG & DROP
---------------------------- */

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#38bdf8";
});

dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "#64748b";
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#64748b";

    selectedFile = e.dataTransfer.files[0];
    setStatus(`Selected: ${selectedFile.name}`);
});

/* ----------------------------
   FILE INPUT
---------------------------- */

fileInput.addEventListener("change", (e) => {
    selectedFile = e.target.files[0];
    setStatus(`Selected: ${selectedFile.name}`);
});

/* ----------------------------
   LOAD FFMPEG
---------------------------- */

async function loadFFmpeg() {
    if (!ffmpeg.loaded) {
        setStatus("Loading converter engine...");

        ffmpeg.on("progress", ({ progress }) => {
            setProgress(progress);
        });

        await ffmpeg.load();
    }
}

/* ----------------------------
   CONVERT FUNCTION
---------------------------- */

convertBtn.addEventListener("click", async () => {
    if (!selectedFile) {
        alert("Please select a file first.");
        return;
    }

    convertBtn.disabled = true;
    output.innerHTML = "";

    try {
        await loadFFmpeg();

        setStatus("Preparing file...");

        const inputName = "input." + selectedFile.name.split(".").pop();
        const outputName = "output.mp3";
        const bitrate = bitrateSelect.value;

        await ffmpeg.writeFile(inputName, await fetchFile(selectedFile));

        setStatus("Converting to MP3...");

        await ffmpeg.exec([
            "-i",
            inputName,
            "-vn",
            "-ar",
            "44100",
            "-ac",
            "2",
            "-b:a",
            bitrate,
            outputName
        ]);

        setStatus("Finalizing...");

        const data = await ffmpeg.readFile(outputName);
        const mp3Blob = new Blob([data.buffer], { type: "audio/mpeg" });

        const url = URL.createObjectURL(mp3Blob);

        output.innerHTML = `
            <a href="${url}" download="converted.mp3">
                ⬇ Download MP3
            </a>
        `;

        setStatus("Done ✔");

    } catch (err) {
        console.error(err);
        setStatus("Error during conversion ❌");
    }

    convertBtn.disabled = false;
});