import Quagga from "https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");

const API_KEY = "soundcat2025";

let cameraStream = null;
let scanning = false;

// ------- 1️⃣ 카메라 권한 요청 + 영상 표시 -------

async function startCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });

        videoElem.srcObject = cameraStream;
        videoElem.setAttribute("playsinline", true);
        videoElem.setAttribute("autoplay", true);
        videoElem.setAttribute("muted", true);

        await videoElem.play();

        // 카메라 준비되면 Quagga 실행
        startScanner();
        
    } catch (err) {
        console.error("❌ 카메라 접근 실패:", err);
        resultElem.textContent = "⚠ 카메라 접근 불가 (브라우저 권한 확인)";
    }
}

// ------- 2️⃣ Quagga 스캔 로직 -------

function startScanner() {
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
            target: videoElem
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
        locate: true
    }, (err) => {
        if (err) {
            console.error("❌ Quagga 초기화 오류:", err);
            resultElem.textContent = "⚠ 스캐너 초기화 실패";
            return;
        }

        Quagga.start();
        resultElem.textContent = "📷 스캔하세요...";
    });

    Quagga.onDetected(handleDetected);
}

async function handleDetected(result) {
    const code = result.codeResult.code;
    if (!code || code.length < 6) return;

    stopScanner();
    await freezeFrame();

    resultElem.textContent = `📌 바코드: ${code}`;
    refreshBtn.style.display = "block";

    fetchProductData(code);
}

// ------- 3️⃣ Freeze Frame -------

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

// ------- 4️⃣ API 호출 -------

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

// ------- 5️⃣ 스캐너 종료 -------

function stopScanner() {
    Quagga.stop();
    scanning = false;
}

// ------- 6️⃣ 다시 스캔 -------

refreshBtn.addEventListener("click", () => {
    startCamera();
});

// 🚀 반드시 사용자 동작 후 실행
document.addEventListener("click", () => {
    if (!cameraStream) startCamera();
}, { once: true });
