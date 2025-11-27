import { BrowserMultiFormatReader } from "https://cdn.jsdelivr.net/npm/@zxing/browser@latest/+esm";

const videoElem = document.getElementById("video");
const resultElem = document.getElementById("barcode-result");
const productArea = document.getElementById("product-info");

let scanner = new BrowserMultiFormatReader();

function lookup(barcode) {
    // 🔍 디버그용: 화면에 바코드 값 보여주기
    resultElem.textContent = `스캔된 값: "${barcode}" (길이: ${barcode.length})`;

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
                productArea.innerHTML = `
                    <h3>❌ 등록되지 않은 바코드</h3>
                    <p>📝 시트에 입력된 값과 같은지 확인</p>
                    <p>📌 아래 값 그대로 시트에 입력:</p>
                    <div style="background:#fff;padding:10px;border-radius:10px;font-size:18px;">
                        "${barcode}"
                    </div>
                `;
            } else {
                productArea.innerHTML = `<h3>⚠ 오류: ${data.message}</h3>`;
            }
        })
        .catch(err => {
            productArea.innerHTML = `<h3>🚨 통신 오류</h3><p>${err}</p>`;
        });
}

scanner.decodeFromVideoDevice(null, videoElem, (result, err) => {
    if (result) {
        lookup(result.text);
    }
});
