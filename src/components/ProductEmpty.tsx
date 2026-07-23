import { Button, Empty, Space, Typography } from 'antd'

type ProductEmptyProps = {
  description: string
  detail?: string
  actionLabel?: string
  onAction?: () => void
}

function ProductEmpty({ description, detail, actionLabel, onAction }: ProductEmptyProps) {
  return (
    <Empty
      className="product-empty"
      description={
        <Space direction="vertical" size={4}>
          <Typography.Text strong>{description}</Typography.Text>
          {detail && <Typography.Text type="secondary">{detail}</Typography.Text>}
          {actionLabel && onAction && <Button type="primary" onClick={onAction}>{actionLabel}</Button>}
        </Space>
      }
      image="/assets/illustrations/empty-intel.svg"
      styles={{ image: { height: 112 } }}
    />
  )
}

export default ProductEmpty
