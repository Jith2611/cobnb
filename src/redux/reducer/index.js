import { combineReducers } from '@reduxjs/toolkit'
import userInfo from './authReducer'

const rootReducer = combineReducers({
  userInfo,
  // Other reducers will be migrated here subsequently
})

export default rootReducer
