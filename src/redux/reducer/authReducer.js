import types from "../types";

const initial_state = {
  loginInfo: undefined,
  isOwner : 0
}

export default function authReducer(state = initial_state, action) {
  switch (action.type) {
    case types.LOGIN:
      return {
        ...state,
        loginInfo: action.payload
      }
    case types.LOGOUT:
      return {
        ...state,
        loginInfo: undefined,
      }
    case types.IS_OWNER:
      return {
        ...state,
        isOwner: action.payload,
      }
    default:
      return state
  }
}
