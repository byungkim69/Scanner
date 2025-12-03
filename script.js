const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");
const freezeImg = document.getElementById("freeze-image");

let stream = null;
const API_KEY = "soundcat2025";

// 버튼 생성 (UI 유지 위해 script에서 추가)
let captureBtn = document.createElement("button");
captureBtn.textContent = "📸 촬영하기";
captureBtn.style = `
    width:90%;
    max-width:350px;
    font-size:22px;
    padding:18px;
    margin-top:18px;
    background:#ff7b00;
    color:white;
    border:none;
    border-radius:12px;
    cursor:pointer;
`;
document.getElementById("app").appendChild(captureBtn);

async function startScanner() {
    freezeImg.style.display = "none";
    videoElem.style.display = "block";
    productArea.innerHTML = "";
    resultElem.textContent = "📡 준비됨 - 바코드 보이면 촬영하세요";
    refreshBtn.style.display = "none";

    stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
    });

    videoElem.srcObject = stream;
    await videoElem.play();
}

// 📸 촬영해서 이미지 스캔
async function captureImage() {
    const canvas = document.createElement("canvas");
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

    const imageDataURL = canvas.toDataURL("image/png");

    freezeImg.src = imageDataURL;
    freezeImg.style.display = "block";
    videoElem.style.display = "none";

    decodeBarcode(imageDataURL);
}

// 🔍 Quagga로 이미지 해석
async function decodeBarcode(image) {
    Quagga.decodeSingle(
        {
            src: image,
            numOfWorkers: 1,
            inputStream: { size: 800 },
            decoder: {
                readers: [
                    "ean_reader",
                    "code_128_reader",
                    "code_39_reader",
                    "codabar_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "i2of5_reader",
                    "code_93_reader"
                ]
            }
        },
        async function (result) {
            if (result?.codeResult?.code) {
                resultElem.textContent = `📌 바코드: ${result.codeResult.code}`;
                await fetchProduct(result.codeResult.code);
            } else {
                resultElem.textContent = `❌ 바코드를 인식하지 못했습니다.`;
            }
            refreshBtn.style.display = "block";
        }
    );
}

// 제품 정보 호출
async function fetchProduct(barcode) {
    const url = `https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=${barcode}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    productArea.innerHTML = data.status === "ok"
        ? `<h3>✔ 제품 정보</h3>
           <p>제품명: ${data.product}</p>
           <p>가격: ₩${data.price}</p>`
        : `<h3>❌ 미등록 상품</h3>`;
}

// 🔄 재촬영
refreshBtn.addEventListener("click", async () => {
    freezeImg.style.display = "none";
    await startScanner();
});

// 📸 버튼 클릭 → 촬영
captureBtn.addEventListener("click", captureImage);

// 최초 실행
startScanner();
