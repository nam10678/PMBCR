// model.js - TF.js model, train, predict
let model = null;

function createModel(inputDim) {
  const m = tf.sequential();
  m.add(tf.layers.dense({units: 64, activation: 'relu', inputShape: [inputDim]}));
  m.add(tf.layers.dropout({rate: 0.2}));
  m.add(tf.layers.dense({units: 32, activation: 'relu'}));
  m.add(tf.layers.dense({units: 3, activation: 'softmax'}));
  m.compile({optimizer: tf.train.adam(0.001), loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy']});
  return m;
}

async function trainModel(X, y, opts={epochs:40, batchSize:32, valSplit:0.15}) {
  const xs = tf.tensor2d(X);
  const ys = tf.tensor1d(y, 'int32');
  model = createModel(X[0].length);
  log('Model created. Training starts...');
  const history = await model.fit(xs, ys, {epochs: opts.epochs, batchSize: opts.batchSize, validationSplit: opts.valSplit, shuffle:true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        log(`Epoch ${epoch+1}/${opts.epochs}: loss=${logs.loss.toFixed(4)} val_loss=${(logs.val_loss||0).toFixed(4)} acc=${(logs.acc||logs.acc).toFixed(3)}`);
      }
    }});
  xs.dispose(); ys.dispose();
  log('Training finished.');
  return history;
}

async function evaluateModel(X_test, y_test) {
  if (!model) { log('No model'); return; }
  const xs = tf.tensor2d(X_test);
  const ys = tf.tensor1d(y_test, 'int32');
  const res = await model.evaluate(xs, ys, {batchSize:32});
  const loss = await res[0].data(); const acc = await res[1].data();
  log(`Test loss=${loss[0].toFixed(4)} acc=${(acc[0]*100).toFixed(2)}%`);
  xs.dispose(); ys.dispose();
}

async function predictFromFeatures(features) {
  if (!model) return null;
  const x = tf.tensor2d([features]);
  const p = model.predict(x);
  const arr = await p.array();
  x.dispose(); p.dispose();
  return arr[0];
}

async function saveModelLocal() {
  if (!model) { log('No model to save'); return; }
  await model.save('localstorage://baccarat-ai-model');
  log('Saved model to localStorage://baccarat-ai-model');
}

async function loadModelLocal() {
  try {
    model = await tf.loadLayersModel('localstorage://baccarat-ai-model');
    log('Model loaded from localStorage');
  } catch (e) {
    log('Failed to load model: ' + e);
  }
}

async function downloadModel() {
  if (!model) { log('No model to download'); return; }
  await model.save('downloads://baccarat-ai-model');
  log('Initiated download of model files.');
}
