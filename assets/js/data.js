export const setData = (key, value) => {
    // console.log(`Setting data: ${key} = ${value}`);
    localStorage.setItem(key, value);
};

export const getData = (key) => {
    const value = localStorage.getItem(key);
    // console.log(`Getting data: ${key} = ${value}`);
    return value;
};