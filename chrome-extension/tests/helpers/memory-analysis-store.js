const { AnalysisJobStore } = require('../../src/background/analysis-job-store');
class MemoryAnalysisStore extends AnalysisJobStore {
  constructor(options) { super(options); this.records = []; this.writes = 0; }
  mutate(transform) {
    const task = this.queue.then(() => {
      if (this.fail) throw new Error('Disk unavailable');
      const update = transform(structuredClone(this.records));
      this.records = this.trim(structuredClone(update.records)); this.writes++;
      return update.result;
    });
    this.queue = task.catch(() => {}); return task;
  }
}
module.exports = { MemoryAnalysisStore };
