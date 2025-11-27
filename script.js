import { BrowserMultiFormatReader } from "https://cdn.jsdelivr.net/npm/@zxing/browser@latest/+esm";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");
const refreshBtn = document.getElementById("refresh-btn");

let scanner = new BrowserMultiFormatReader();
let stream = null; // 카메라 스트림 저장

// 📷 스캐너 시작 함수
async function startScanner() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoElem.srcObject = stream;

        scanner.decodeFromVideoDevice(null, videoElem, (result, err) => {
            if (result) {
                stopScanner(); // 스캔 즉시 멈춤
                handleScan(result.text);
            }
        });
    } catch (err) {
        console.error("카메라 불러오기 오류:", err);
    }
}

// 📷 스캐너 정지 함수
function stopScanner() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// 🔍 조회 + 화면 표시
function handleScan(barcode) {
    resultElem.textContent = barcode;
    refreshBtn.style.display = "block";

    const url = "https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=" + barcode;

    fetch(url)
        .then(res => res.json())
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

// 🔄 다시 스캔 버튼
refreshBtn.addEventListener("click", () => {
    productArea.innerHTML = "";
    resultElem.textContent = "";
    refreshBtn.style.display = "none";
    startScanner(); // 🔥 카메라 + 스캐너 다시 실행
});

// 첫 실행
startScanner();
