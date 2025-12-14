// utils.js - parsing formula.json and preprocessing helpers
let FORMULA = []; // loaded pattern groups (array of arrays)
async function loadFormula() {
  try {
    const resp = await fetch('formula.json');
    FORMULA = await resp.json();
    document.getElementById('formulaContent').textContent = JSON.stringify(FORMULA.slice(0,200), null, 2);
    log('formula.json loaded, groups: ' + FORMULA.length);
  } catch (e) {
    document.getElementById('formulaContent').textContent = 'Không load được formula.json: ' + e;
    log('Lỗi load formula.json: ' + e);
  }
}
function flattenPatterns(K=50) {
  const flat = [];
  FORMULA.forEach(group=>{
    group.forEach(item=>{
      if (item && item.data) flat.push(item.data.toLowerCase());
    });
  });
  const freq = {};
  flat.forEach(s => freq[s] = (freq[s]||0)+1);
  const items = Object.keys(freq).sort((a,b)=> freq[b]-freq[a]);
  return items.slice(0, K);
}

function encodeWindow(winStr, N) {
  winStr = winStr.toLowerCase();
  const map = {p: [1,0,0], b: [0,1,0], t: [0,0,1]};
  const v = [];
  for (let i=0;i<N;i++){
    const ch = winStr[i] || 'p';
    v.push(...(map[ch]||[0,0,0]));
  }
  return v;
}

function buildDataset(history, N=5, patternsList=[]) {
  const X = [];
  const y = [];
  for (let i=0;i+N < history.length; i++){
    const window = history.slice(i, i+N).join('').toLowerCase();
    const next = history[i+N];
    const base = encodeWindow(window, N);
    const patFeat = patternsList.map(p=> window.endsWith(p) ? 1 : 0);
    const counts = {p:0,b:0,t:0};
    window.split('').forEach(ch=> counts[ch] = (counts[ch]||0)+1);
    const freqFeat = [counts.p / N, counts.b / N, counts.t / N];
    const features = base.concat(patFeat).concat(freqFeat);
    X.push(features);
    const label = next === 'P' ? 0 : next === 'B' ? 1 : 2;
    y.push(label);
  }
  return {X, y};
}

function log(msg) {
  const el = document.getElementById('log');
  el.textContent += msg + '\n';
  el.scrollTop = el.scrollHeight;
}
