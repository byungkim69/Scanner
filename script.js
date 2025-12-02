import { BrowserMultiFormatReader, DecodeHintType } from "https://cdn.jsdelivr.net/npm/@zxing/browser@latest/+esm";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");

let scanner;
let stream = null;
const API_KEY = "soundcat2025";

// 🔥 인식률 강화 옵션 (중요)
const hints = new Map();
hints.set(DecodeHintType.ASSUME_GS1, true);
hints.set(DecodeHintType.TRY_HARDER, true);
hints.set(DecodeHintType.ALLOWED_EAN_EXTENSIONS, [2, 5]);

scanner = new BrowserMultiFormatReader(hints);

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
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        videoElem.srcObject = stream;

        scanner.decodeFromVideoDevice(null, videoElem, (result, err) => {
            // result === 성공 / err === 그냥 진행
            if (result) {
                processScan(result.text);
            }
        });

    } catch (error) {
        console.error("📌 카메라 접근 오류:", error);
        resultElem.textContent = "⚠ 카메라 권한을 허용해주세요";
    }
}

async function processScan(barcode) {
    stopScanner();
    await freezeFrame();

    resultElem.textContent = barcode;
    refreshBtn.style.display = "block";

    const url =
        "https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=" +
        barcode + "&key=" + API_KEY;

    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (data.status === "ok") {
                productArea.innerHTML = `
                    <h3>✔ 제품 정보</h3>
                    <p><b>바코드:</b> ${data.barcode}</p>
                    <p><b>상품명:</b> ${data.product}</p>
                    <p><b>소비자가:</b> ₩${data.price}</p>
                    <p><b>1개월 써보기:</b> ₩${data.try1month}</p>
                    <p><b>인수:</b> ₩${data.buy}</p>
                    <p><b>재고:</b> ${data.stock}</p>
                `;
            } else {
                productArea.innerHTML = `<h3>❌ 등록되지 않은 상품입니다.</h3>`;
            }
        });
}

function stopScanner() {
    scanner.stopContinuousDecode();

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

async function freezeFrame() {
    await new Promise(res => setTimeout(res, 80)); // 안정성 유지

    const canvas = document.createElement("canvas");
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

    freezeImg.src = canvas.toDataURL("image/png");
    videoElem.style.display = "none";
    freezeImg.style.display = "block";
}

refreshBtn.addEventListener("click", () => startScanner());

startScanner();
