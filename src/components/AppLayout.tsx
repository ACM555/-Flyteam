import {
  FileSearchOutlined,
  FileTextOutlined,
  HomeOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Layout, Menu, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'

const { Content, Header, Sider } = Layout

const navigationItems: MenuProps['items'] = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/submit', icon: <SendOutlined />, label: '品牌提交' },
  { key: '/reviewing', icon: <FileSearchOutlined />, label: '审查进度' },
  { key: '/report', icon: <FileTextOutlined />, label: '审查报告' },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible theme="dark" width={220}>
        <div style={{ height: 72, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <Typography.Text strong style={{ color: '#fff', fontSize: 16 }}>
            Outbound-Guard
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={navigationItems}
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            alignItems: 'center',
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 24px',
          }}
        >
          <Avatar icon={<UserOutlined />} />
        </Header>
        <Content style={{ background: '#f5f5f5', padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
