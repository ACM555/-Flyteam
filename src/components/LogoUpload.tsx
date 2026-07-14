import { DeleteOutlined, InboxOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Spin, Upload, Typography } from 'antd'
import type { RcFile } from 'antd/es/upload/interface'
import { useEffect, useState } from 'react'

interface LogoUploadProps {
  onChange?: (base64: string) => void
  value?: string
}

const validImageTypes = ['image/png', 'image/jpeg']
const maxFileSize = 5 * 1024 * 1024

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function LogoUpload({ onChange, value }: LogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const { message } = AntdApp.useApp()

  useEffect(() => {
    if (!value) {
      setPreviewUrl('')
    }
  }, [value])

  const processFile = async (file: File) => {
    setLoading(true)

    try {
      const result = await readFileAsDataUrl(file)
      const pureBase64 = result.split(',')[1] ?? ''

      setPreviewUrl(result)
      onChange?.(pureBase64)
    } catch {
      message.error('图片读取失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (file: RcFile) => {
    if (!validImageTypes.includes(file.type)) {
      message.error('仅支持 JPG / PNG 格式')
      return Upload.LIST_IGNORE
    }

    if (file.size > maxFileSize) {
      message.error('图片大小不能超过 5MB')
      return Upload.LIST_IGNORE
    }

    processFile(file)
    return false
  }

  const handleRemove = () => {
    setPreviewUrl('')
    onChange?.('')
  }

  const preview = (
    <div className="logo-preview">
      <img
        alt="已上传的商标 Logo 预览"
        className="logo-preview-image"
        src={previewUrl}
      />
      <Button
        danger
        aria-label="删除 Logo"
        className="logo-preview-remove"
        icon={<DeleteOutlined />}
        onClick={handleRemove}
        shape="circle"
      />
    </div>
  )

  const dragger = (
    <Upload.Dragger
      accept="image/png,image/jpeg"
      beforeUpload={handleFile}
      maxCount={1}
      showUploadList={false}
      className="logo-uploader"
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽上传商标 Logo</p>
      <p className="ant-upload-hint">仅支持 JPG / PNG，单张不超过 5MB</p>
    </Upload.Dragger>
  )

  return (
    <div className="logo-upload-field">
      <Spin spinning={loading} tip="正在读取图片">
        {previewUrl ? preview : dragger}
      </Spin>
      <Typography.Text className="field-help">
        图片只用于本次图形特征分析，任务完成后上传文件将被清理。
      </Typography.Text>
    </div>
  )
}

export default LogoUpload
