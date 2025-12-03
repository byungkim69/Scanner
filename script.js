import { BrowserMultiFormatReader } from "https://cdn.jsdelivr.net/npm/@zxing/library@latest/+esm";

const API_KEY = "soundcat2025";
const video = document.getElementById("video");
const preview = document.getElementById("preview");
const captureBtn = document.getElementById("capture-btn");
const retryBtn = document.getElementById("retry-btn");
const barcodeResult = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");

let stream = null;
let scanner = new BrowserMultiFormatReader();

async function startCamera() {
    stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
    });

    video.srcObject = stream;
    video.style.display = "block";
    preview.style.display = "none";
    retryBtn.style.display = "none";
    barcodeResult.textContent = "";
    productArea.innerHTML = "";
}

async function captureImage() {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // 🔥 이미지 전처리: grayscale + adaptive threshold
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    // grayscale
    for (let i = 0; i < data.length; i+=4) {
        const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
        data[i] = gray;
        data[i+1] = gray;
        data[i+2] = gray;
    }

    // threshold (adaptive-ish)
    let avg = 128;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] > avg ? 255 : 0;
        data[i+1] = data[i];
        data[i+2] = data[i];
    }

    ctx.putImageData(imageData, 0, 0);

    const processedImage = canvas.toDataURL("image/png");
    preview.src = processedImage;

    video.style.display = "none";
    preview.style.display = "block";
    retryBtn.style.display = "block";

    decodeBarcode(processedImage);
}

async function decodeBarcode(image) {
    try {
        const result = await scanner.decodeFromImage(undefined, image);
        barcodeResult.textContent = `📌 바코드: ${result.text}`;
        fetchProduct(result.text);
    } catch {
        barcodeResult.textContent = `❌ 인식 실패 (다시 촬영)`;
    }
}

async function fetchProduct(barcode) {
    const url = `https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=${barcode}&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    productArea.innerHTML = data.status === "ok"
        ? `
        <h3>✔ 제품 정보</h3>
        <p><b>상품명:</b> ${data.product}</p>
        <p><b>가격:</b> ₩${data.price}</p>
        <p><b>재고:</b> ${data.stock}</p>`
        : `<h3>❌ 미등록 상품</h3>`;
}

captureBtn.addEventListener("click", captureImage);
retryBtn.addEventListener("click", startCamera);

startCamera();
