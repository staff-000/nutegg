let worker = null;
let queue = Promise.resolve();

function getWorker() {
  if (!worker) worker = new Worker('regex-worker.js');
  return worker;
}

function resetWorker() {
  if (!worker) return;
  try {
    worker.terminate();
  } catch {}
  worker = null;
}

function runInWorker(args) {
  return new Promise(resolve => {
    const active = getWorker();
    let settled = false;
    const done = value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      active.onmessage = null;
      active.onerror = null;
      resolve(value);
    };
    const timer = setTimeout(() => {
      resetWorker();
      done({ error: 'Rule evaluation timed out' });
    }, 250);
    active.onmessage = event => done(event.data);
    active.onerror = () => {
      resetWorker();
      done({ error: 'Rule evaluation failed' });
    };
    active.postMessage(args);
  });
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (
    message.action !== 'panel-evaluate-regex' ||
    sender.id !== chrome.runtime.id ||
    sender.url !== chrome.runtime.getURL('src/background/service-worker.js')
  )
    return;
  const task = queue.then(() => runInWorker(message.args));
  queue = task.catch(() => {});
  task.then(respond);
  return true;
});
