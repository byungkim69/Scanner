import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "https://cdn.jsdelivr.net/npm/@zxing/library@latest/+esm";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");

let stream = null;
const API_KEY = "soundcat2025";

// 📌 인식률 강화 옵션
const hints = new Map();
hints.set(DecodeHintType.TRY_HARDER, true);
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR
]);

let scanner = new BrowserMultiFormatReader(hints);

async function startScanner() {
    freezeImg.style.display = "none";
    videoElem.style.display = "block";
    productArea.innerHTML = "";
    resultElem.textContent = "";
    refreshBtn.style.display = "none";

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        videoElem.srcObject = stream;

        scanner.decodeFromVideoDevice(null, videoElem, (result) => {
            if (result) processScan(result.text);
        });

    } catch (error) {
        console.error("카메라 접근 오류:", error);
    }
}

async function processScan(barcode) {
    stopScanner();
    await freezeFrame();

    resultElem.textContent = barcode;
    refreshBtn.style.display = "block";

    const url =
        `https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=${barcode}&key=${API_KEY}`;

    fetch(url)
        .then(r => r.json())
        .then(data => {
            productArea.innerHTML = data.status === "ok"
                ? `
                <h3>✔ 제품 정보</h3>
                <p><b>바코드:</b> ${data.barcode}</p>
                <p><b>상품명:</b> ${data.product}</p>
                <p><b>소비자가:</b> ₩${data.price}</p>
                <p><b>1개월 써보기:</b> ₩${data.try1month}</p>
                <p><b>인수:</b> ₩${data.buy}</p>
                <p><b>재고:</b> ${data.stock}</p>`
                : `<h3>❌ 등록되지 않은 상품입니다.</h3>`;
        });
}

function stopScanner() {
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    scanner.reset();
}

async function ensureVideoReady() {
    return new Promise((resolve) => {
        const check = () => {
            if (videoElem.videoWidth > 10 && videoElem.videoHeight > 10) resolve();
            else setTimeout(check, 50);
        };
        check();
    });
}

async function freezeFrame() {
    await ensureVideoReady(); // ⬅ 여기가 핵심

    await new Promise(res => setTimeout(res, 80));

    const canvas = document.createElement("canvas");
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

    freezeImg.src = canvas.toDataURL("image/jpeg", 0.9);
    videoElem.style.display = "none";
    freezeImg.style.display = "block";
}

refreshBtn.addEventListener("click", startScanner);

startScanner();
