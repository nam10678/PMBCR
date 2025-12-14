// app.js - UI glue
let historyArr = []; // e.g. ['P','B','P',...]
let patternsTop = [];

document.getElementById('btnP').onclick = ()=>{ historyArr.push('P'); renderHistory(); doPredictIfModel(); };
document.getElementById('btnB').onclick = ()=>{ historyArr.push('B'); renderHistory(); doPredictIfModel(); };
document.getElementById('btnT').onclick = ()=>{ historyArr.push('T'); renderHistory(); doPredictIfModel(); };
document.getElementById('btnUndo').onclick = ()=>{ historyArr.pop(); renderHistory(); doPredictIfModel(); };
document.getElementById('btnReset').onclick = ()=>{ historyArr=[]; renderHistory(); document.getElementById('prediction').textContent='Chưa có mô hình'; };

document.getElementById('btnBuildData').onclick = ()=> {
  const N = parseInt(document.getElementById('windowSize').value);
  const K = parseInt(document.getElementById('patternCount').value);
  patternsTop = flattenPatterns(K);
  const ds = buildDataset(historyArr, N, patternsTop);
  window._dataset = ds;
  log('Built dataset samples=' + ds.X.length + ' features=' + (ds.X[0]?ds.X[0].length:0));
};

document.getElementById('btnTrain').onclick = async ()=>{
  if (!window._dataset || (window._dataset.X||[]).length===0) { log('Không có dataset, bấm Build dataset trước'); return; }
  await trainModel(window._dataset.X, window._dataset.y, {epochs:40, batchSize:32});
  log('Done training. You can Save model.');
};

document.getElementById('btnEval').onclick = async ()=>{
  if (!window._dataset || window._dataset.X.length<10) { log('Dataset quá nhỏ'); return; }
  const n = window._dataset.X.length;
  const split = Math.floor(n*0.85);
  const Xtrain = window._dataset.X.slice(0, split);
  const ytrain = window._dataset.y.slice(0, split);
  const Xtest = window._dataset.X.slice(split);
  const ytest = window._dataset.y.slice(split);
  await trainModel(Xtrain, ytrain, {epochs:30, batchSize:16, valSplit:0.15});
  await evaluateModel(Xtest, ytest);
};

document.getElementById('btnSave').onclick = ()=> saveModelLocal();
document.getElementById('btnLoad').onclick = ()=> loadModelLocal();

function renderHistory() {
  const el = document.getElementById('history');
  el.innerHTML = '';
  historyArr.forEach((r,i)=>{
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = r;
    el.appendChild(chip);
  });
}

async function doPredictIfModel() {
  if (!model) return;
  const N = parseInt(document.getElementById('windowSize').value);
  if (historyArr.length < N) { document.getElementById('prediction').textContent = 'Cần ít nhất ' + N + ' ván để dự đoán'; return; }
  const windowStr = historyArr.slice(-N).join('');
  const base = encodeWindow(windowStr, N);
  const patFeat = (patternsTop||[]).map(p => windowStr.endsWith(p) ? 1 : 0);
  const counts = {p:0,b:0,t:0}; windowStr.split('').forEach(ch=>counts[ch]= (counts[ch]||0)+1);
  const freqFeat = [counts.p/N, counts.b/N, counts.t/N];
  const features = base.concat(patFeat).concat(freqFeat);
  const probs = await predictFromFeatures(features);
  if (!probs) return;
  const labels = ['P','B','T'];
  const maxIdx = probs.indexOf(Math.max(...probs));
  const percent = Math.round(probs[maxIdx]*100);
  const txt = `Dự đoán: ${labels[maxIdx]} — ${percent}%  (P:${Math.round(probs[0]*100)} B:${Math.round(probs[1]*100)} T:${Math.round(probs[2]*100)})`;
  document.getElementById('prediction').textContent = txt;
  if (percent >= 70) {
    document.getElementById('prediction').textContent += " — LỆNH: ĐI " + labels[maxIdx];
  }
}

loadFormula();
renderHistory();
