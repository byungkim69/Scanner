import { BrowserMultiFormatReader } from "https://cdn.jsdelivr.net/npm/@zxing/browser@latest/+esm";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");

let scanner = new BrowserMultiFormatReader();

// 🔥 API URL
function lookup(barcode) {
    const url = "https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=" + barcode;

    fetch(url)
        .then(res => res.json())
        .then(data => {

            if (data.status === "ok") {
                productArea.innerHTML = `
                    <h3>✔ 제품 정보</h3>
                    <p><b>바코드:</b> ${data.barcode}</p>
                    <p><b>상품명:</b> ${data.product}</p>
                    <p><b>소비자가:</b> ${data.price}</p>
                    <p><b>1개월 써보기:</b> ${data.try1month}</p>
                    <p><b>인수:</b> ${data.buy}</p>
                    <p><b>재고:</b> ${data.stock}</p>
                `;
            } else {
                productArea.innerHTML = `
                    <h3>❌ 등록되지 않은 상품입니다.</h3>
                    <p>관리자에게 등록 요청하세요.</p>
                `;
            }
        })
        .catch(err => {
            productArea.innerHTML = `
                <h3>🚨 서버 통신 오류</h3>
                <p>${err}</p>
            `;
        });
}

//📷 카메라 켜고 스캔
scanner.decodeFromVideoDevice(null, videoElem, (result, err) => {
    if (result) {
        resultElem.textContent = result.text;
        lookup(result.text);
    }
});
