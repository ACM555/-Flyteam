import { useEffect } from 'react'
import { Spin, Steps, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

function Reviewing() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = window.setTimeout(() => navigate('/report'), 3000)
    return () => window.clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{ margin: '64px auto', maxWidth: 520 }}>
      <Typography.Title level={2}>AI 合规审查中...</Typography.Title>
      <div style={{ margin: '40px 0 32px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
      <Steps
        current={0}
        direction="vertical"
        items={[
          { title: '法条规则匹配' },
          { title: '多模态视觉比对' },
          { title: '风险综合评估' },
        ]}
      />
      <Typography.Paragraph type="secondary" style={{ marginTop: 32 }}>
        预计耗时 3-5 秒，请勿关闭页面...
      </Typography.Paragraph>
    </div>
  )
}

export default Reviewing
