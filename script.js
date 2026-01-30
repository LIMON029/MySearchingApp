// ⚠️ 여기에 본인의 티처블 머신 모델 URL 넣기!
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/4PQxNADdV/";

let model = null;
let video = null;
let isModelLoaded = false;

// 페이지 전환 함수
function goPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  
  if (pageId === 'capture') {
    initCamera();
  }
}

// 1️⃣ 카메라만 먼저 시작
function initCamera() {
  video = document.getElementById('camera');
  
  navigator.mediaDevices.getUserMedia({ 
    video: { 
      facingMode: 'environment', // 후면 카메라
      width: { ideal: 640 },
      height: { ideal: 480 }
    } 
  })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    console.error("카메라 에러:", err);
    alert("카메라를 사용할 수 없어요!");
  });
  
  // 결과 영역 초기화
  document.getElementById('result').innerHTML = '';
}

// 2️⃣ AI 모델 로드 (백그라운드에서 미리)
async function loadModel() {
  if (isModelLoaded) return;
  
  try {
    console.log("🤖 AI 모델 로딩 중...");
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    isModelLoaded = true;
    console.log("✅ AI 모델 로드 완료!");
  } catch (error) {
    console.error("AI 모델 로드 실패:", error);
  }
}

// 3️⃣ 촬영 버튼 클릭 시에만 실행!
document.getElementById('capture-btn').addEventListener('click', async function() {
  // 모델이 아직 없으면 로드
  if (!model) {
    await loadModel();
    if (!model) {
      alert("AI 모델을 불러올 수 없어요!");
      return;
    }
  }
  
  // 로딩 표시
  const result = document.getElementById('result');
  result.innerHTML = '<p>🔍 AI가 분석 중이에요...</p>';
  
  // 현재 영상을 캔버스에 캡처
  const canvas = document.getElementById('ai-canvas');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, 224, 224);
  
  // AI 예측 실행
  const prediction = await model.predict(canvas);
  let bestPrediction = null;
  let highestProbability = 0;
  
  for (let i = 0; i < prediction.length; i++) {
    if (prediction[i].probability > highestProbability) {
      highestProbability = prediction[i].probability;
      bestPrediction = prediction[i];
    }
  }
  
  // 결과 표시
  showResult(bestPrediction.className, highestProbability);
});

// 4️⃣ 결과 표시 (✅ 초록색 O / ❌ 회색 X)
function showResult(itemName, probability) {
  const result = document.getElementById('result');
  
  if (probability > 0.5 && itemName !== "알수없음") {
    result.innerHTML = `
      <div class="card" style="max-width: 300px; margin: 0 auto; border-left: 5px solid #4CAF50;">
        <div class="success-mark">✅</div>
        <h3>🎉 발견됨!</h3>
        <p><strong>${itemName}</strong></p>
        <p>분실물 보관소에 있습니다!</p>
        <p>신뢰도: ${(probability * 100).toFixed(1)}%</p>
      </div>
    `;
  } else {
    result.innerHTML = `
      <div style="background: rgba(255,107,107,0.2); padding: 30px; border-radius: 15px; border-left: 5px solid #ff6b6b;">
        <div class="no-image-big">❌</div>
        <h3>😢 검색 결과 없음</h3>
        <p>분실물 보관소에 없습니다.</p>
      </div>
    `;
  }
}

// 페이지 로드시 모델 미리 로딩 시작
window.addEventListener('load', loadModel);
