module.exports = {
  seq: function(fns) {
    let result = Promise.resolve();
    for (const fn of fns) {
      result = result.then(() => fn());
    }
    return result;
  }
};
