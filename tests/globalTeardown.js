module.exports = async () => {
  if (globalThis.__MONGO__) await globalThis.__MONGO__.stop();
};