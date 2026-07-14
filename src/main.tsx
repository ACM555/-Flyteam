import React from 'react'
import ReactDOM from 'react-dom/client'
import { App as AntdApp, ConfigProvider } from 'antd'
import 'antd/dist/reset.css'
import App from '@/App'
import '@/styles/theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 6,
          colorBgBase: '#f4fbfa',
          colorBorder: '#bbc9c9',
          colorError: '#ba1a1a',
          colorInfo: '#006a6a',
          colorPrimary: '#006a6a',
          colorSuccess: '#2f7d32',
          colorText: '#161d1d',
          colorTextSecondary: '#3c4949',
          colorWarning: '#994712',
          controlHeight: 44,
          fontFamily:
            'Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif',
        },
        components: {
          Button: { primaryShadow: 'none' },
          Card: { headerBg: '#ffffff' },
          Layout: { bodyBg: '#f4fbfa', headerBg: '#ffffff', siderBg: '#001529' },
          Menu: {
            darkItemBg: '#001529',
            darkItemSelectedBg: '#004f50',
            darkItemSelectedColor: '#ffffff',
          },
        },
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
)
