import Quagga from "https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");

let stream = null;
const API_KEY = "soundcat2025";

async function startScanner() {
    freezeImg.style.display = "none";
    videoElem.style.display = "block";
    productArea.innerHTML = "";
    resultElem.textContent = "";
    refreshBtn.style.display = "none";

    try {
        // 카메라 스트림 연결
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoElem.srcObject = stream;
        await videoElem.play();

        // Quagga 실행
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
                    "ean_reader",
                    "code_128_reader",
                    "code_39_reader",
                    "itf_reader",
                    "codabar_reader"
                ]
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error("Quagga 초기화 오류:", err);
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected(data => {
            if (!data || !data.codeResult || !data.codeResult.code) return;
            processScan(data.codeResult.code);
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
    try {
        Quagga.stop();
    } catch (e) {}

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

async function freezeFrame() {
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
