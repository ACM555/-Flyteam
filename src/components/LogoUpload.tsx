import { DeleteOutlined, InboxOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Spin, Upload } from 'antd'
import type { RcFile } from 'antd/es/upload/interface'
import { useEffect, useState } from 'react'

interface LogoUploadProps { onChange?: (base64: string) => void; value?: string }
const validImageTypes = ['image/png', 'image/jpeg']
const maxFileSize = 5 * 1024 * 1024

function readFileAsDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file) }) }

function LogoUpload({ onChange, value }: LogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const { message } = AntdApp.useApp()
  useEffect(() => { setPreviewUrl(value ? `data:image/png;base64,${value}` : '') }, [value])
  const processFile = async (file: File) => { setLoading(true); try { const result = await readFileAsDataUrl(file); const pureBase64 = result.split(',')[1] ?? ''; setPreviewUrl(result); onChange?.(pureBase64) } catch { message.error('图片读取失败') } finally { setLoading(false) } }
  const handleFile = (file: RcFile) => { if (!validImageTypes.includes(file.type)) { message.error('仅支持 JPG 或 PNG 格式'); return Upload.LIST_IGNORE } if (file.size > maxFileSize) { message.error('图片大小不能超过 5MB'); return Upload.LIST_IGNORE } void processFile(file); return false }
  const handleRemove = () => { setPreviewUrl(''); onChange?.('') }
  return <Spin spinning={loading}>{previewUrl ? <div className="logo-preview"><img alt="品牌图样预览" src={previewUrl} /><Button danger aria-label="删除品牌图样" icon={<DeleteOutlined />} onClick={handleRemove} shape="circle" size="small" /></div> : <Upload.Dragger accept="image/png,image/jpeg" beforeUpload={handleFile} className="logo-uploader" maxCount={1} showUploadList={false}><p className="ant-upload-drag-icon"><InboxOutlined /></p><p className="ant-upload-text">点击或拖拽品牌图样至此区域</p><p className="ant-upload-hint">支持 JPG、PNG，单张不超过 5MB</p></Upload.Dragger>}</Spin>
}

export default LogoUpload
