import {
  AppstoreOutlined,
  BellOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Drawer, Layout, Menu, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useState } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import WorkflowRail from '@/components/WorkflowRail'

const { Content, Sider } = Layout

const navigationItems: MenuProps['items'] = [
  { key: '/', icon: <AppstoreOutlined />, label: '数据概览' },
  { key: '/submit', icon: <SendOutlined />, label: '品牌提交' },
  { key: '/reviewing', icon: <FileSearchOutlined />, label: '审查进度' },
  { key: '/report', icon: <FileTextOutlined />, label: '审查报告' },
]

function getSelectedKey(pathname: string) {
  if (pathname.startsWith('/report')) return '/report'
  if (pathname.startsWith('/reviewing')) return '/reviewing'
  if (pathname.startsWith('/submit')) return '/submit'
  return '/'
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'brand-block brand-block--compact' : 'brand-block'}>
      <div className="brand-symbol" aria-hidden="true">
        <SafetyCertificateOutlined />
      </div>
      <div>
        <Typography.Text className="brand-name">Outbound-Guard</Typography.Text>
        {!compact && <Typography.Text className="brand-subtitle">越南商标合规审查</Typography.Text>}
      </div>
    </div>
  )
}

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const selectedKey = getSelectedKey(location.pathname)

  const handleNavigate: MenuProps['onClick'] = ({ key }) => {
    setDrawerOpen(false)
    navigate(key)
  }

  const menu = (
    <Menu
      className="app-navigation"
      theme="dark"
      mode="inline"
      items={navigationItems}
      selectedKeys={[selectedKey]}
      onClick={handleNavigate}
    />
  )

  return (
    <Layout className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <Sider className="app-sidebar" theme="dark" width={240}>
        <BrandBlock />
        {menu}
        <div className="sidebar-footer">
          <Space align="center" size={12}>
            <Avatar icon={<UserOutlined />} />
            <div>
              <Typography.Text className="sidebar-user-name">合规审查员</Typography.Text>
              <Typography.Text className="sidebar-user-role">工作空间</Typography.Text>
            </div>
          </Space>
        </div>
      </Sider>
      <Layout className="app-stage">
        <header className="mobile-header">
          <Button
            aria-label="打开导航菜单"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            type="text"
          />
          <BrandBlock compact />
          <Space size={0}>
            <Button aria-label="帮助" icon={<QuestionCircleOutlined />} type="text" />
            <Button aria-label="通知" icon={<BellOutlined />} type="text" />
          </Space>
        </header>
        <div className="app-workbench">
          <Content className="app-content" id="main-content" tabIndex={-1}>
            <Outlet />
          </Content>
          <WorkflowRail />
        </div>
      </Layout>
      <Drawer
        className="mobile-drawer"
        placement="left"
        width={280}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={<BrandBlock compact />}
      >
        {menu}
      </Drawer>
    </Layout>
  )
}

export default AppLayout
