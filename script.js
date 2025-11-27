<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="module">
    import { BrowserMultiFormatReader } from "https://cdn.jsdelivr.net/npm/@zxing/browser@latest/+esm";

    let codeReader = new BrowserMultiFormatReader();

    window.onload = () => {
      const videoElem = document.getElementById("video");

      // 카메라 켜기 + 바코드 스캔
      codeReader.decodeFromVideoDevice(null, videoElem, (result, err) => {
        if (result) {
          document.getElementById("result").innerText = result.text;
          lookup(result.text);
        }
      });
    };

    // 바코드 → 구글시트 조회
    async function lookup(barcode) {
      const url = `https://script.google.com/macros/s/AKfycbxovfUZWiG1lgvhd8W5xhYURE7fTqTPEsuKPIoyUm7BTRzpUE7jW3512GS4EDKvVMAuBQ/exec?barcode=${barcode}`;
      const res = await fetch(url);
      const data = await res.json();

      const area = document.getElementById("info");
      if (data.status === "ok") {
        area.innerHTML = `
          <h3>조회 결과</h3>
          <p><b>상품명:</b> ${data.product}</p>
          <p><b>소비자가:</b> ${data.price}</p>
          <p><b>1개월 써보기:</b> ${data.try1month}</p>
          <p><b>인수:</b> ${data.buy}</p>
          <p><b>재고:</b> ${data.stock}</p>
        `;
      } else {
        area.innerHTML = "<h3>조회 결과 없음</h3>";
      }
    }
  </script>
</head>
<body>

  <h2>📷 바코드 스캐너</h2>
  <video id="video" style="width:100%; max-width:400px;" autoplay></video>

  <h3>스캔된 코드</h3>
  <div id="result" style="font-size:20px; font-weight:bold;"></div>

  <div id="info"></div>

</body>
</html>
