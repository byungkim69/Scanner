const codeReader = new ZXing.BrowserMultiFormatReader();

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");
const startBtn = document.getElementById("start-btn");

const API_KEY = "soundcat2025";

let stream = null;
let scanning = false;

async function startScanner() {
    scanning = true;

    startBtn.style.display = "none";
    freezeImg.style.display = "none";
    videoElem.style.display = "block";
    refreshBtn.style.display = "none";
    resultElem.textContent = "📡 카메라 활성화 중...";

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        videoElem.srcObject = stream;
        await videoElem.play();

        codeReader.decodeFromVideoDevice(null, videoElem, (result, err) => {
            if (result) processScan(result.text);
        });

    } catch (err) {
        console.error(err);
        resultElem.textContent = "⚠ 카메라 권한을 허용해주세요.";
    }
}

function stopScanner() {
    codeReader.reset();
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    scanning = false;
}

async function processScan(barcode) {
    stopScanner();
    await freezeFrame();

    resultElem.textContent = `📌 바코드: ${barcode}`;
    refreshBtn.style.display = "block";

    const url =
        `https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=${barcode}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

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
}

async function freezeFrame() {
    await new Promise(res => setTimeout(res, 120));

    const canvas = document.createElement("canvas");
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;
    canvas.getContext("2d").drawImage(videoElem, 0, 0, canvas.width, canvas.height);

    freezeImg.src = canvas.toDataURL("image/png");
    videoElem.style.display = "none";
    freezeImg.style.display = "block";
}

startBtn.addEventListener("click", startScanner);
refreshBtn.addEventListener("click", startScanner);
