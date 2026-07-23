import { AlertOutlined, ApiOutlined, AppstoreOutlined, BankOutlined, DatabaseOutlined, FileSearchOutlined, FileTextOutlined, HomeOutlined, LogoutOutlined, MenuOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Drawer, Layout, Menu, Space, Tag, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { PageTransition } from '@/components/MotionKit'
import { useAuth } from '@/context/AuthContext'
import { usePresentation } from '@/context/PresentationContext'

const { Content, Header, Sider } = Layout

function selectedKey(pathname: string) {
  if (pathname.startsWith('/assets')) return '/assets'
  if (pathname.startsWith('/submit')) return '/submit'
  if (pathname.startsWith('/reviewing')) return '/reviewing'
  if (pathname.startsWith('/reports') || pathname.startsWith('/report')) return '/reports'
  if (pathname.startsWith('/monitoring')) return '/monitoring'
  if (pathname.startsWith('/rules')) return '/rules'
  if (pathname.startsWith('/admin')) return '/admin'
  return '/'
}

function BrandBlock() {
  return <div className="brand-block"><img alt="东盟商标合规智能体" className="brand-mark-img" src="/assets/brand/outbound-guard-mark.svg" /><div className="brand-copy"><span className="brand-title">东盟商标合规智能体</span><span className="brand-subtitle">OUTBOUND GUARD · 企业法务驾驶舱</span></div></div>
}

const baseNavigation: Exclude<MenuProps['items'], undefined> = [
  { key: '/', icon: <HomeOutlined />, label: '风险工作台' },
  { key: '/assets', icon: <AppstoreOutlined />, label: '品牌资产库' },
  { key: '/submit', icon: <SendOutlined />, label: '智能审查' },
  { key: '/reviewing', icon: <FileSearchOutlined />, label: '审查进度' },
  { key: '/reports', icon: <FileTextOutlined />, label: '报告中心' },
  { key: '/monitoring', icon: <AlertOutlined />, label: '监控预警' },
  { key: '/rules', icon: <DatabaseOutlined />, label: '东盟规则库' },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, logout, user } = useAuth()
  const { mode, exitPresentation } = usePresentation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuItems: MenuProps['items'] = [...baseNavigation, ...(isAdmin ? [{ key: '/admin', icon: <BankOutlined />, label: '后台管理' }] : [])]

  const go = (key: string) => { navigate(key); setMobileNavOpen(false) }
  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }) }
  const leavePresentation = () => {
    exitPresentation()
    if (mode === 'demo') navigate('/login', { replace: true })
    else window.location.reload()
  }

  const statusLabel = mode === 'demo' ? '比赛演示空间' : '演示数据兜底'
  return (
    <Layout className="app-shell">
      <Sider className="app-sider" width={248} breakpoint="lg" collapsedWidth={0} trigger={null}>
        <BrandBlock />
        <Menu aria-label="主导航" className="side-menu" mode="inline" items={menuItems} selectedKeys={[selectedKey(location.pathname)]} onClick={({ key }) => go(key)} />
        <div className="side-status"><LiveStatus mode={mode} /><Typography.Paragraph>覆盖注册前预检、品牌资产管理、公告期监控和规则证据归档。</Typography.Paragraph></div>
      </Sider>
      <Drawer className="mobile-nav-drawer" open={mobileNavOpen} placement="left" title={<BrandBlock />} onClose={() => setMobileNavOpen(false)} width={280} styles={{ body: { padding: 0, background: 'var(--navy-900)' } }}>
        <Menu aria-label="主导航" className="side-menu" mode="inline" items={menuItems} selectedKeys={[selectedKey(location.pathname)]} onClick={({ key }) => go(key)} />
      </Drawer>
      <Layout>
        <Header className="app-header">
          <Button aria-label="打开导航" className="header-mobile-trigger" icon={<MenuOutlined />} onClick={() => setMobileNavOpen(true)} type="text" />
          <Space className="header-desktop-meta" size={12}><span className="header-product-name">东盟商标合规工作台</span><Tag icon={<ApiOutlined />} className="header-source-tag">NOIP · WIPO · TMview 数据已接入</Tag></Space>
          <Space size={10} wrap style={{ marginLeft: 'auto' }}>
            {mode !== 'live' ? <button className="presentation-banner" data-mode={mode} onClick={leavePresentation} type="button"><span>{statusLabel}</span>退出</button> : null}
            <Button onClick={() => navigate('/submit')} type="primary">新建审查</Button>
            {isAuthenticated ? <><Typography.Text className="header-user-name" type="secondary">{user?.company || user?.username || '当前账户'}</Typography.Text><Button icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button></> : <Button onClick={() => navigate('/login')}>登录</Button>}
            <Avatar icon={<UserOutlined />} />
          </Space>
        </Header>
        <Content className="app-content"><div className="app-content-inner"><PageTransition><Outlet /></PageTransition></div></Content>
      </Layout>
    </Layout>
  )
}

function LiveStatus({ mode }: { mode: string }) {
  return <span className={`side-live ${mode !== 'live' ? 'fallback' : ''}`}><span />{mode === 'live' ? '生产数据链路正常' : '当前为只读演示数据'}</span>
}

export default AppLayout
