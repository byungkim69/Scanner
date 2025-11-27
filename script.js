import { BrowserMultiFormatReader } from "https://cdn.jsdelivr.net/npm/@zxing/browser@latest/+esm";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");

let scanner = new BrowserMultiFormatReader();
let stream = null;
const API_KEY = "soundcat2025";

async function startScanner() {
    freezeImg.style.display = "none";
    videoElem.style.display = "block";
    productArea.innerHTML = "";
    resultElem.textContent = "";
    refreshBtn.style.display = "none";

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoElem.srcObject = stream;

        scanner.decodeFromVideoDevice(null, videoElem, (result, err) => {
            if (result) processScan(result.text);
        });
    } catch (error) {
        console.error("카메라 접근 오류:", error);
    }
}

async function processScan(barcode) {
    stopScanner(); // 카메라 먼저 멈춤
    await freezeFrame(); // 화면 캡처

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
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

async function freezeFrame() {
    // 🔥 여기서 100ms 딜레이로 안정화
    await new Promise(res => setTimeout(res, 100));

    const canvas = document.createElement("canvas");
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

    freezeImg.src = canvas.toDataURL("image/png");
    videoElem.style.display = "none";
    freezeImg.style.display = "block";
}

refreshBtn.addEventListener("click", () => {
    startScanner();
});

startScanner();
