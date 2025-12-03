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

// 📌 범용 스캔 설정 (Precision Mode)
const hints = new Map();
hints.set(DecodeHintType.TRY_HARDER, true);
hints.set(DecodeHintType.ALLOWED_LENGTHS, null);
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR
]);

const scanner = new BrowserMultiFormatReader(hints);

async function startScanner() {
    freezeImg.style.display = "none";
    videoElem.style.display = "block";
    productArea.innerHTML = "";
    refreshBtn.style.display = "none";
    resultElem.textContent = "📡 스캔 준비중...";

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                focusMode: "continuous" // 🔥 모바일 카메라 자동 초점 유지
            }
        });

        videoElem.srcObject = stream;
        await ensureVideoReady(); // ⬅ freeze 깨짐 방지 핵심

        scanner.decodeFromVideoDevice(null, videoElem, (result, err) => {
            if (result) processScan(result.getText());
        });

    } catch (err) {
        resultElem.textContent = "⚠ 카메라 접근 오류: 권한 설정 확인";
        console.error(err);
    }
}

// 🔧 영상 준비될 때까지 반복 체크 → freeze 오류 방지
async function ensureVideoReady() {
    return new Promise(res => {
        const check = () => {
            if (videoElem.videoWidth > 10) res();
            else setTimeout(check, 50);
        };
        check();
    });
}

async function processScan(barcode) {
    stopScanner();
    await freezeFrame();

    resultElem.textContent = `📌 ${barcode}`;
    refreshBtn.style.display = "block";

    const url = `https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=${barcode}&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    productArea.innerHTML = (data.status === "ok")
        ? `
        <h3>✔ 제품 정보</h3>
        <p><b>바코드:</b> ${data.barcode}</p>
        <p><b>상품명:</b> ${data.product}</p>
        <p><b>소비자가:</b> ₩${data.price}</p>
        <p><b>1개월 써보기:</b> ₩${data.try1month}</p>
        <p><b>인수:</b> ₩${data.buy}</p>
        <p><b>재고:</b> ${data.stock}</p>
        `
        : `<h3>❌ 미등록 상품</h3>`;
}

function stopScanner() {
    stream?.getTracks().forEach(t => t.stop());
    scanner.reset();
}

// 📸 안정 freeze (Safari/WebKit 대응 완료)
async function freezeFrame() {
    await ensureVideoReady();
    await new Promise(res => setTimeout(res, 120));

    const canvas = document.createElement("canvas");
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

    freezeImg.src = canvas.toDataURL("image/jpeg", 0.92); // JPEG 품질 ↑
    videoElem.style.display = "none";
    freezeImg.style.display = "block";
}

refreshBtn.addEventListener("click", startScanner);
startScanner();
