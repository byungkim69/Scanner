import Quagga from "https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");

const API_KEY = "soundcat2025";
let scanning = false;

async function startScanner() {
    if (scanning) return;
    scanning = true;

    freezeImg.style.display = "none";
    videoElem.style.display = "block";
    productArea.innerHTML = "";
    resultElem.textContent = "📡 스캔 준비중...";
    refreshBtn.style.display = "none";

    Quagga.init({
        inputStream: {
            type: "LiveStream",
            target: videoElem,
            constraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        },
        decoder: {
            readers: [
                "code_128_reader",
                "code_39_reader",
                "ean_reader",
                "ean_8_reader",
                "itf_reader",
                "codabar_reader"
            ]
        },
        locate: true,
        numOfWorkers: navigator.hardwareConcurrency || 4,
    }, err => {
        if (err) {
            console.error("❌ Quagga 초기화 오류:", err);
            resultElem.textContent = "⚠ 카메라 오류 또는 권한 거부됨";
            scanning = false;
            return;
        }

        Quagga.start();
        resultElem.textContent = "📷 스캔하세요...";
    });

    Quagga.onDetected(onBarcodeDetected);
}

async function onBarcodeDetected(result) {
    const code = result.codeResult.code;

    // 덜완성된 값 걸러내기 (Quagga의 흔한 문제)
    if (!code || code.length < 6) return;

    console.log("📌 감지됨:", code);

    stopScanner();
    await freezeFrame();

    resultElem.textContent = `📌 바코드: ${code}`;
    refreshBtn.style.display = "block";

    fetchProductData(code);
}

function stopScanner() {
    Quagga.stop();
    scanning = false;
}

async function freezeFrame() {
    await new Promise(res => setTimeout(res, 120));

    const canvas = document.createElement("canvas");
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

    freezeImg.src = canvas.toDataURL("image/png");
    videoElem.style.display = "none";
    freezeImg.style.display = "block";
}

function fetchProductData(code) {
    const url =
        `https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=${code}&key=${API_KEY}`;

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

refreshBtn.addEventListener("click", startScanner);

// 초반 자동 시작
setTimeout(startScanner, 400);
