// Map-backed stand-in for @forge/kvs, with the same shapes:
// get returns undefined for a missing key, values are JSON-cloned like KVS.
function createFakeStore() {
  const map = new Map();
  const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
  return {
    async get(key) {
      return clone(map.get(key));
    },
    async set(key, value) {
      map.set(key, clone(value));
    },
    async delete(key) {
      map.delete(key);
    }
  };
}

module.exports = { createFakeStore };
