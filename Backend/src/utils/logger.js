
exports.log = (fn, msg, data = '') => {
  console.log(`[${fn}] ${msg}`, data);
};
exports.err = (fn, msg, data = '') => {
  console.error(`[${fn}] ${msg}`, data);
};
