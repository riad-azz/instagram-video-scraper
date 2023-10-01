const setCache = async (cache, key, value, expire = 3600) => {
  const cachedValue = JSON.stringify(value);
  cache.set(key, cachedValue, expire);
}

const getCache = async (cache, cacheKey) => {
  try {
    const cachedValue = await cache.get(cacheKey);
    if (cachedValue) {
      const parsedValue = JSON.parse(cachedValue);
      return parsedValue;
    }
  } catch (error) {
    console.log("Error fetching cached response:", error); // eslint-disable-line no-console
  }

  return null;
};



module.exports = {
  setCache,
  getCache,
}