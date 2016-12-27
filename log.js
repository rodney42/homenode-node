module.exports = logger;
function logger(area) {
  return function(msg) {
      console.log(area + "\t: " + new Date().toISOString() + " : " + msg);
  }
}