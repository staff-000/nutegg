importScripts('rules.js');
self.onmessage = event => {
  try {
    self.postMessage({ result: NutEggRules.decide(...event.data) });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
