export const storeData = async (tokenType, value, callback) => {
    try {
        localStorage.setItem(tokenType, value);
        if (callback) callback();
    } catch (e) {
        console.error("error in store data", e);
    }
}

export const getData = async (tokenType) => {
    try {
        const value = localStorage.getItem(tokenType);
        return value !== null ? value : undefined;
    } catch (e) {
        console.error("error in get data", e);
    }
}

export const removeData = async (tokenType) => {
    try {
        localStorage.removeItem(tokenType);
    } catch (e) {
        console.error("error in remove local data", e);
    }
}
