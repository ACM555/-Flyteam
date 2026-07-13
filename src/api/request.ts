import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => {
    const res = response.data

    if (res?.code !== undefined && res.code !== 0) {
      const errorMessage = res.message || '请求失败'
      message.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }

    return res
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const msg =
        status === 500
          ? '服务器内部错误'
          : status === 404
            ? '接口不存在'
            : status === 429
              ? '请求过于频繁，请稍后重试'
              : `网络错误 (${status})`

      message.error(msg)
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络后重试')
    } else {
      message.error('网络连接失败，请检查后端服务是否启动')
    }

    return Promise.reject(error)
  },
)

export default request
