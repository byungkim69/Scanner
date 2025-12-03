import {
    BrowserMultiFormatReader,
    DecodeHintType,
    BarcodeFormat
} from "https://cdn.jsdelivr.net/npm/@zxing/library@latest/+esm";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");

let stream = null;
const API_KEY = "soundcat2025";

// 안정 스캔 설정
const hints = new Map();
hints.set(DecodeHintType.TRY_HARDER, true);
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR
]);

const scanner = new BrowserMultiFormatReader(hints);

let scanBuffer = []; // 📌 값 누적 버퍼

async function startScanner() {
    scanBuffer = []; // reset buffer
    freezeImg.style.display = "none";
    videoElem.style.display = "block";
    productArea.innerHTML = "";
    refreshBtn.style.display = "none";
    resultElem.textContent = "📡 인식중...";

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                focusMode: "continuous"
            }
        });

        videoElem.srcObject = stream;
        await ensureVideoReady();

        scanner.decodeFromVideoDevice(null, videoElem, (result, err) => {
            if (!result) return;

            const raw = result.getText().trim();
            if (!raw) return;

            stabilizeScan(raw);
        });

    } catch (err) {
        resultElem.textContent = "⚠ 카메라 접근오류";
        console.error(err);
    }
}

// 📌 스캔 안정화 알고리즘
function stabilizeScan(value) {
    scanBuffer.push(value);

    const count = scanBuffer.filter(v => v === value).length;

    // 같은 바코드 3번 이상 감지되면 확정
    if (count >= 3) {
        processScan(value);
        scanner.reset();
    } else {
        resultElem.textContent = `스캔 중... (${count}/3)`;
    }
}

async function processScan(barcode) {
    stopScanner();
    await freezeFrame();

    resultElem.textContent = `📌 ${barcode}`;
    refreshBtn.style.display = "block";

    const url = `https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=${barcode}&key=${API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        productArea.innerHTML = (data.status === "ok")
            ? `
            <h3>✔ 제품 정보</h3>
            <p><b>상품명:</b> ${data.product}</p>
            <p><b>가격:</b> ₩${data.price}</p>
            <p><b>재고:</b> ${data.stock}</p>`
            : `<h3>❌ 등록되지 않은 상품</h3>`;
    } catch {
        productArea.innerHTML = "⚠ 네트워크 오류";
    }
}

function stopScanner() {
    stream?.getTracks().forEach(t => t.stop());
    scanner.reset();
}

async function ensureVideoReady() {
    return new Promise(res => {
        const wait = () => {
            if (videoElem.videoWidth > 20) res();
            else setTimeout(wait, 50);
        };
        wait();
    });
}

async function freezeFrame() {
    await ensureVideoReady();
    await new Promise(res => setTimeout(res, 120));

    const canvas = document.createElement("canvas");
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;

    canvas.getContext("2d").drawImage(videoElem, 0, 0);
    freezeImg.src = canvas.toDataURL("image/jpeg", 0.92);

    videoElem.style.display = "none";
    freezeImg.style.display = "block";
}

refreshBtn.addEventListener("click", startScanner);

startScanner();
