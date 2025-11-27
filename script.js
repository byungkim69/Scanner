import { BrowserMultiFormatReader } from "https://cdn.jsdelivr.net/npm/@zxing/browser@latest/+esm";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");

let scanner = new BrowserMultiFormatReader();

// 🔥 네 API URL
function lookup(barcode) {
    const url = "https://script.google.com/macros/s/AKfycbw0Fdo4vgsc6uvD1qNeimy2yuvYZ4sjdXYrb-cFo3duk04U-mzZxL5AZwq3pjwjAEYHXQ/exec?barcode=" + barcode;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            console.log("응답:", data);

            if (data.status === "ok") {
                productArea.innerHTML = `
                    <h3>✔ 조회 성공</h3>
                    <p><b>상품명:</b> ${data.product}</p>
                    <p><b>소비자가:</b> ${data.price}</p>
                    <p><b>1개월 써보기:</b> ${data.try1month}</p>
                    <p><b>인수:</b> ${data.buy}</p>
                    <p><b>재고:</b> ${data.stock}</p>
                `;
            } else if (data.status === "not_found") {
                productArea.innerHTML = `<h3>❌ 등록되지 않은 바코드입니다.</h3>`;
            } else {
                productArea.innerHTML = `<h3>⚠ 오류 발생: ${data.message}</h3>`;
            }
        })
        .catch(err => {
            productArea.innerHTML = `<h3>🚨 통신 오류 발생</h3><p>${err}</p>`;
        });
}


// 📷 카메라 켜고 스캔 시작
scanner.decodeFromVideoDevice(null, videoElem, (result, err) => {
    if (result) {
        resultElem.textContent = result.text;
        lookup(result.text);
    }
});

console.log("스캔값:", barcode);
