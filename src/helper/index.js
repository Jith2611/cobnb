import store from "../redux/store";
import axios from "axios";
import { BASE_URL } from "./Config";
import { client_id, client_secret, grant_type, refresh_token } from "../constants/appconstant";
import { storeData } from "../utility/LocalStorageService";

export const getCommonHeaders = () => {
  const state = store.getState();
  let lang = state.langInfo?.language;
  const userToken = state.userInfo?.loginInfo;

  let commonHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };
  if (lang) {
    commonHeaders['Accept-Language'] = lang;
  }
  if (userToken) {
    commonHeaders['Authorization'] = `Bearer ${userToken}`;
  }
  return commonHeaders;
};

export async function ApiRequest(endUrl, method, headers, body) {
  try {
    let requestHeaders = getCommonHeaders();
    if (headers) {
      requestHeaders = { ...requestHeaders, ...headers };
    }
    const options = {
      method: method,
      headers: requestHeaders,
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log('options ====>', options);
    const response = await fetch(endUrl, options);
    
    if (response?.status === 200) {
      const responseJson = await response.json();
      return responseJson;
    }
  } catch (e) {
    console.error("API Request Error:", e);
  }
}

export const fetchRefreshToken = async () => {
  try {
    const res = await axios.post(`/zoho-accounts/oauth/v2/token?refresh_token=${refresh_token}&client_id=${client_id}&client_secret=${client_secret}&grant_type=${grant_type}`, {});
    console.log(res.data, 'res');
    if (res?.data?.access_token) {
      await storeData('refreshToken', res?.data?.access_token);
      return true;
    }
  } catch (error) {
    console.error("Fetch Refresh Token Error:", error);
  }
}
