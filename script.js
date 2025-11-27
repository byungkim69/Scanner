import { BrowserMultiFormatReader } from "https://cdn.jsdelivr.net/npm/@zxing/browser@latest/+esm";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");

let scanner = new BrowserMultiFormatReader();

// 카메라 켜고 스캔 시작
scanner.decodeFromVideoDevice(null, videoElem, (result, err) => {
    if (result) {
        console.log("바코드 감지:", result.text);
        resultElem.textContent = result.text;
        lookup(result.text); // 인식되면 제품 조회 실행
    }
});

// ---- Google Sheet 조회 ----
async function lookup(barcode) {
    const url = `https://script.google.com/macros/s/AKfycbymZKqCzNpr7kqBscZiIG8aAyrMXjd5he6zAivuxB_2dM6YMFZ0AU6CbZnOTpiSpCAjJA/exec?barcode=${barcode}`; // ← 중요

    const response = await fetch(url);
    const data = await response.json();

    const productArea = document.getElementById("product-info");

    if (data.status === "ok") {
        productArea.innerHTML = `
            <h3>✔ 조회 성공</h3>
            <p><b>상품명:</b> ${data.product}</p>
            <p><b>소비자가:</b> ${data.price}</p>
            <p><b>1개월 써보기:</b> ${data.try1month}</p>
            <p><b>인수:</b> ${data.buy}</p>
            <p><b>재고:</b> ${data.stock}</p>
        `;
    } else {
        productArea.innerHTML = `<h3>❌ 해당 바코드 없음</h3>`;
    }
}

