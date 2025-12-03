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
    resultElem.textContent = "📡 스캔 대기...";
    refreshBtn.style.display = "none";

    stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
    });

    videoElem.srcObject = stream;
    await videoElem.play();

    Quagga.init({
        inputStream: {
            type: "LiveStream",
            target: videoElem,
            constraints: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            area: { // 인식 영역 확대
                top: "0%",
                right: "0%",
                left: "0%",
                bottom: "0%"
            }
        },
        locator: {
            patchSize: "large", // small | medium | large (large=느리지만 정확)
            halfSample: false
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        frequency: 10,
        decoder: {
            readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader",
                "2of5_reader",
                "code_93_reader",
            ],
            debug: {
                drawBoundingBox: true,
                showFrequency: true,
                drawScanline: true,
                showPattern: true
            }
        },
        locate: true
    }, (err) => {
        if (err) {
            console.error(err);
            resultElem.textContent = "⚠ 스캐너 초기화 오류";
            return;
        }
        Quagga.start();
        resultElem.textContent = "📷 바코드를 카메라 앞에 가져가세요";
    });


    Quagga.onDetected((data) => {
        // console.log(data);
        const code = data.codeResult.code;
        if (!code) return;
        processScan(code);
    });
}

async function processScan(barcode) {
    stopScanner();
    await freezeFrame();

    resultElem.textContent = barcode;
    refreshBtn.style.display = "block";

    const url = `https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=${barcode}&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    productArea.innerHTML = data.status === "ok"
        ? `<h3>✔ 제품 정보</h3>
           <p>제품명: ${data.product}</p>
           <p>가격: ₩${data.price}</p>`
        : `<h3>❌ 미등록 상품</h3>`;
}

function stopScanner() {
    Quagga.stop();
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
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
    freezeImg.style.display = "block";
    videoElem.style.display = "none";
}

refreshBtn.addEventListener("click", startScanner);

startScanner();

