const usage = require('cpu-percentage');
const v8 = require('v8');

global.usageWarning = false;

let cpuMax = 85;
let heapMax = 1500000000; //1.4Gb

module.exports = {

  wait : 0,

  init : function() {
    this.startUsage = usage();
  },

  update : function(dt) {
    if ((this.wait += dt) > 3) {
      this.wait = 0;
      let mem = process.memoryUsage();
      let cpuWarning  = usage(this.startUsage).percent > cpuMax;
      let heapWarning = mem.rss > heapMax;
      usageWarning = cpuWarning || heapWarning;
      if (usageWarning) {
        console.log(new Date() + ": CPU " + usage(this.startUsage).percent.toFixed(2) + ", Mem " + (mem.rss / 1024 / 1024).toFixed(2) + "Mb (" + (mem.heapUsed / 1024 / 1024).toFixed(2) + "/" + (mem.heapTotal / 1024 / 1024).toFixed(2) + ")" );
        if (heapWarning) global.gc();
      }
    }
  }

}
