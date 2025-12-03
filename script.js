const codeReader = new ZXing.BrowserMultiFormatReader();

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");

const API_KEY = "soundcat2025";

let stream = null;
let scanning = false;
let initialized = false;

// ⭐ 핵심: 첫 화면 터치/클릭 감지 → 권한 요청
document.addEventListener("click", async () => {
    if (!initialized && document.getElementById("app").style.display === "block") {
        initialized = true;
        await startScanner();
    }
}, { once: true });

async function startScanner() {
    scanning = true;

    freezeImg.style.display = "none";
    videoElem.style.display = "block";
    refreshBtn.style.display = "none";
    resultElem.textContent = "📡 카메라 활성화 중...";

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        videoElem.srcObject = stream;
        await videoElem.play();

        codeReader.decodeFromVideoDevice(null, videoElem, (result, err) => {
            if (result) processScan(result.text);
        });

    } catch (err) {
        console.error(err);
        resultElem.textContent = "⚠ 카메라 권한 허용 필요";
    }
}

function stopScanner() {
    codeReader.reset();
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
}

async function processScan(barcode) {
    stopScanner();
    await freezeFrame();

    resultElem.textContent = `📌 바코드: ${barcode}`;
    refreshBtn.style.display = "block";

    const url = `https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=${barcode}&key=${API_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();

    productArea.innerHTML = (data.status === "ok")
        ? `<h3>✔ 제품 정보</h3>
            <p>상품명: ${data.product}</p>
            <p>가격: ₩${data.price}</p>
            <p>재고: ${data.stock}</p>`
        : `<h3>❌ 미등록 상품</h3>`;
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

refreshBtn.addEventListener("click", () => {
    initialized = true;
    startScanner();
});
