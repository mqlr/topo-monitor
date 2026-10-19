import type { Edge, Node } from '@xyflow/react'

export type Status = 'healthy' | 'notice' | 'warning' | 'critical'
export type NodeKind = 'gateway' | 'service' | 'database' | 'cache' | 'queue' | 'server' | 'metric' | 'text' | 'table'
export type AlertRule = { enabled: boolean; expression: string; thresholds: number[] }
export type ItemData = {
  label: string
  kind: NodeKind
  subtitle: string
  value: number
  unit: string
  metric: string
  detail: string
  status: Status
  dataset: string
  field: string
  bindings: string[]
  rule: AlertRule
  [key: string]: unknown
}
export type TopologyNode = Node<ItemData, 'service'>
export type TopologyEdge = Edge<ItemData>
export type Dataset = { id: string; name: string; source: string; type: string; fields: Record<string, number>; unit: string }
export const datasets: Dataset[] = [
  { id: 'orders', name: '订单业务指标', source: '生产环境 MySQL', type: 'MySQL', fields: { total: 1286, success: 1258, latency: 32, baseline: 1280 }, unit: '次/秒' },
  { id: 'payment', name: '支付服务指标', source: '支付监控 API', type: 'HTTP', fields: { total: 856, success: 644, latency: 128, baseline: 850 }, unit: '次/秒' },
  { id: 'mysql', name: '数据库性能指标', source: '生产环境 MySQL', type: 'MySQL', fields: { total: 86, success: 86, latency: 12, baseline: 100 }, unit: '个' },
  { id: 'redis', name: '缓存命中指标', source: '基础设施 PostgreSQL', type: 'PostgreSQL', fields: { total: 99.8, success: 99.8, latency: 2, baseline: 100 }, unit: '%' },
  { id: 'kafka', name: '消息队列指标', source: '中间件监控 API', type: 'HTTP', fields: { total: 2450, success: 1060, latency: 560, baseline: 1500 }, unit: '条' },
  { id: 'gateway', name: '网关流量指标', source: '网关监控 API', type: 'HTTP', fields: { total: 2142, success: 2140, latency: 8, baseline: 2100 }, unit: '次/秒' },
]
export const objects = [
  { id: 'order-app', name: 'order-service', type: '软件服务', address: '10.0.12.21:8080', status: 'healthy' as Status, message: '服务运行正常，最近一次心跳 5 秒前', metric: 'CPU 23.6% · 内存 42.1%' },
  { id: 'order-host', name: 'prod-server-01', type: '服务器', address: '10.0.12.21', status: 'healthy' as Status, message: '主机在线，所有健康检查通过', metric: 'CPU 31.2% · 内存 56.8%' },
  { id: 'mysql-db', name: 'mysql-primary', type: '数据库', address: '10.0.16.10:3306', status: 'healthy' as Status, message: '数据库连接正常，无慢查询告警', metric: '连接数 86 · 响应 12ms' },
  { id: 'redis-cache', name: 'redis-cluster', type: 'Redis', address: '10.0.16.20:6379', status: 'healthy' as Status, message: '缓存集群运行正常', metric: '命中率 99.8% · 响应 2ms' },
  { id: 'payment-app', name: 'payment-service', type: '软件服务', address: '10.0.12.22:8080', status: 'warning' as Status, message: '支付成功量与请求量偏差 24.77%，触发警告阈值', metric: '响应 128ms · 错误率 24.77%' },
  { id: 'kafka-mq', name: 'kafka-broker-01', type: 'Kafka', address: '10.0.16.30:9092', status: 'critical' as Status, message: '消息消费偏差 56.73%，消费者存在积压', metric: '积压 2,450 条 · 响应 560ms' },
  { id: 'gateway-app', name: 'api-gateway', type: '软件服务', address: '10.0.10.10:80', status: 'healthy' as Status, message: '网关运行正常，路由健康', metric: 'QPS 2,142 · 响应 8ms' },
]
export const statusNames: Record<Status, string> = { healthy: '正常', notice: '关注', warning: '警告', critical: '严重' }
export const statusColors: Record<Status, string> = { healthy: 'var(--success)', notice: 'var(--notice)', warning: 'var(--warning)', critical: 'var(--destructive)' }
export const defaultRule = (dataset = 'orders'): AlertRule => ({ enabled: true, expression: `(${dataset}.total - ${dataset}.success) / ${dataset}.total * 100`, thresholds: [1, 10, 20, 50] })
function data(label: string, kind: NodeKind, dataset: string, bindings: string[], subtitle: string, metric: string, detail: string, status: Status = 'healthy'): ItemData {
  const ds = datasets.find(d => d.id === dataset)!
  return { label, kind, dataset, field: 'total', bindings, subtitle, metric, detail, status, value: ds.fields.total, unit: ds.unit, rule: defaultRule(dataset) }
}
export const initialNodes: TopologyNode[] = [
  { id: 'gateway', type: 'service', position: { x: 0, y: 165 }, data: data('API 网关', 'gateway', 'gateway', ['gateway-app'], 'API Gateway', '实时请求量', '平均响应 8 ms') },
  { id: 'order', type: 'service', selected: true, position: { x: 310, y: 55 }, data: data('订单服务', 'service', 'orders', ['order-app', 'order-host'], 'Order Service', '每秒请求数', '平均响应 32 ms') },
  { id: 'payment', type: 'service', position: { x: 310, y: 305 }, data: data('支付服务', 'service', 'payment', ['payment-app'], 'Payment Service', '每秒请求数', '平均响应 128 ms', 'warning') },
  { id: 'mysql', type: 'service', position: { x: 655, y: 0 }, data: data('MySQL 数据库', 'database', 'mysql', ['mysql-db'], 'MySQL Database', '活跃连接数', '查询耗时 12 ms') },
  { id: 'redis', type: 'service', position: { x: 655, y: 200 }, data: data('Redis 缓存', 'cache', 'redis', ['redis-cache'], 'Redis Cache', '缓存命中率', '内存使用 42.6%') },
  { id: 'kafka', type: 'service', position: { x: 655, y: 400 }, data: data('Kafka 消息队列', 'queue', 'kafka', ['kafka-mq'], 'Kafka Message Queue', '消息积压量', '消费偏差 56.73%', 'critical') },
]
const connections: [string, string, string, string, Status][] = [
  ['gateway', 'order', 'HTTP', 'orders', 'healthy'],
  ['gateway', 'payment', 'HTTP', 'payment', 'warning'],
  ['order', 'mysql', 'SQL', 'mysql', 'healthy'],
  ['order', 'redis', 'GET / SET', 'redis', 'healthy'],
  ['payment', 'redis', 'GET / SET', 'redis', 'healthy'],
  ['payment', 'kafka', '消息投递', 'kafka', 'critical'],
]
export const initialEdges: TopologyEdge[] = connections.map(([source, target, label, dataset, status], i) => ({
  id: `edge-${i}`, source, target, label, type: 'smoothstep', animated: true,
  style: { stroke: statusColors[status], strokeWidth: 1.6 },
  labelStyle: { fill: 'var(--muted-foreground)', fontSize: 13 },
  labelBgStyle: { fill: 'var(--canvas)' }, labelBgPadding: [8, 5], labelBgBorderRadius: 4,
  data: data(`${initialNodes.find(n => n.id === source)!.data.label} → ${initialNodes.find(n => n.id === target)!.data.label}`, 'gateway', dataset, initialNodes.find(n => n.id === target)!.data.bindings, label, '连线指标', '', status),
}))

export function expressionValues(nodes: TopologyNode[], sources: Dataset[] = datasets) {
  return Object.fromEntries([...sources.flatMap(d => Object.entries(d.fields).map(([key, value]) => [`${d.id}.${key}`, value])), ...nodes.map(n => [`node.${n.id}`, n.data.value])]) as Record<string, number>
}

// A small arithmetic grammar keeps user expressions separate from executable JavaScript.
export function evaluateExpression(expression: string, values: Record<string, number>): number {
  if (!expression.trim() || expression.length > 2000) throw new Error('请输入有效的表达式（最多 2000 字符）')
  const tokens = expression.match(/[A-Za-z_][\w.]*(?!\w)|\d+(?:\.\d+)?|[()+\-*/]|\S/g) || []
  let at = 0
  function atom(): number {
    const token = tokens[at++]
    if (token === '+' || token === '-') return (token === '-' ? -1 : 1) * atom()
    if (token === '(') { const result = sum(); if (tokens[at++] !== ')') throw new Error('括号不匹配'); return result }
    if (token && /^\d+(?:\.\d+)?$/.test(token)) return Number(token)
    if (token && Object.prototype.hasOwnProperty.call(values, token)) return values[token]
    throw new Error(`无法识别变量：${token || '表达式不完整'}`)
  }
  function product(): number {
    let result = atom()
    while (tokens[at] === '*' || tokens[at] === '/') {
      const op = tokens[at++]; const right = atom()
      if (op === '/' && right === 0) throw new Error('除数不能为 0')
      result = op === '*' ? result * right : result / right
    }
    return result
  }
  function sum(): number {
    let result = product()
    while (tokens[at] === '+' || tokens[at] === '-') { const op = tokens[at++]; const right = product(); result = op === '+' ? result + right : result - right }
    return result
  }
  const result = sum()
  if (at !== tokens.length || !Number.isFinite(result)) throw new Error('表达式格式不正确')
  return result
}
export function statusForValue(value: number, thresholds: number[]): Status {
  const absolute = Math.abs(value)
  if (absolute >= thresholds[3]) return 'critical'
  if (absolute >= thresholds[2]) return 'warning'
  if (absolute >= thresholds[1]) return 'notice'
  return 'healthy'
}
