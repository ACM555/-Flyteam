import { InboxOutlined } from '@ant-design/icons'
import { Button, Form, Input, Select, Space, Typography, Upload } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Dragger } = Upload

function Submit() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 760 }}>
      <Typography.Title level={2}>品牌信息提交</Typography.Title>
      <Form layout="vertical">
        <Form.Item label="品牌名称" name="brandName">
          <Input placeholder="请输入品牌名称" />
        </Form.Item>
        <Form.Item label="尼斯分类" name="niceClass">
          <Select
            placeholder="请选择尼斯分类"
            options={[
              { label: '第43类-餐饮', value: '43' },
              { label: '第25类-服装', value: '25' },
              { label: '第30类-食品', value: '30' },
            ]}
          />
        </Form.Item>
        <Form.Item label="商标图片">
          <Dragger accept="image/*" maxCount={1} beforeUpload={() => false}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽商标图片至此区域</p>
            <p className="ant-upload-hint">支持单张图片上传</p>
          </Dragger>
        </Form.Item>
        <Form.Item label="附加说明" name="notes">
          <Input.TextArea placeholder="选填，补充品牌背景信息" rows={4} />
        </Form.Item>
        <Space>
          <Button type="primary" onClick={() => navigate('/reviewing')}>
            提交审查
          </Button>
          <Button htmlType="reset">重置</Button>
        </Space>
      </Form>
    </div>
  )
}

export default Submit
