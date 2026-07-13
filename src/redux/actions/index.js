import store from "../store";
import types from "../types";

export const saveUserData = (data) => {
  store.dispatch({
    type: types.LOGIN,
    payload: data
  });
}

export const setLoaderVisibility = (data) => {
  store.dispatch({
    type: types.LOADER,
    payload: data
  });
}

export const setIsOwner = (data) => {
  store.dispatch({
    type: types.IS_OWNER,
    payload: data
  });
}
