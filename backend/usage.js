const usage = require('cpu-percentage');
const v8 = require('v8');

global.usage_warning = false;

let cpu_max = 85;
let heap_max = 1500000000; //1.4Gb

module.exports = {

  wait : 0,

  init : function() {
    this.start_usage = usage();
  },

  update : function(dt) {
    if ((this.wait += dt) > 3) {
      this.wait = 0;
      let mem = process.memoryUsage();
      let cpu_warning  = usage(this.start_usage).percent > cpu_max;
      let heap_warning = mem.rss > heap_max;
      usage_warning = cpu_warning || heap_warning;
      if (usage_warning) {
        console.log(new Date() + ": CPU " + usage(this.start_usage).percent.toFixed(2) + ", Mem " + (mem.rss / 1024 / 1024).toFixed(2) + "Mb (" + (mem.heapUsed / 1024 / 1024).toFixed(2) + "/" + (mem.heapTotal / 1024 / 1024).toFixed(2) + ")" );
        if (heap_warning) global.gc();
      }
    }
  }

}
