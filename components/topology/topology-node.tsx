'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Boxes, Database, Globe, Layers3, Server, Table2, Type, Workflow, Gauge, Link2, ArrowUpRight, MoreHorizontal } from 'lucide-react'
import type { NodeKind, TopologyNode } from '@/lib/topology'
import { statusNames } from '@/lib/topology'
import { cn } from '@/lib/utils'

export const nodeIcons = { gateway: Globe, service: Boxes, database: Database, cache: Layers3, queue: Workflow, server: Server, metric: Gauge, text: Type, table: Table2 }
export const kindNames: Record<NodeKind, string> = { gateway: '网关', service: '应用服务', database: '数据库', cache: '缓存', queue: '消息队列', server: '服务器', metric: '指标卡片', text: '文本', table: '数据表格' }

export const ServiceNode = memo(function ServiceNode({ data, selected }: NodeProps<TopologyNode>) {
  const Icon = nodeIcons[data.kind]
  return <article data-kind={data.kind} className={cn('topology-node', selected && 'is-selected', `status-${data.status}`)}>
    <Handle type="target" position={Position.Left} />
    <header className="node-heading">
      <span className="node-icon"><Icon size={21} strokeWidth={1.7} /></span>
      <div className="min-w-0 flex-1"><h3 className="truncate">{data.label}</h3><p>{data.subtitle}</p></div>
      <MoreHorizontal size={17} className="text-muted-foreground" />
    </header>
    {data.kind === 'table' ? <div className="node-table"><div><span>指标字段</span><span>当前值</span></div><div><span>{data.field}</span><strong>{data.value.toLocaleString()}</strong></div></div> : data.kind === 'text' ? <p className="node-text">{data.metric}：<strong>{data.value.toLocaleString()} {data.unit}</strong></p> : <div className="node-metrics"><p>{data.metric}</p><div className="flex items-baseline gap-2"><strong>{data.value.toLocaleString()}</strong><span>{data.unit}</span><span className="node-trend"><ArrowUpRight size={14} />{data.status === 'healthy' ? '稳定' : statusNames[data.status]}</span></div></div>}
    <div className="node-detail">{data.detail || `数据集 · ${data.dataset}`}</div>
    <footer className="node-footer"><span className="status-label"><i />{statusNames[data.status]}</span><span className="flex items-center gap-1"><Link2 size={13} />{data.bindings.length} 个监控对象</span></footer>
    <Handle type="source" position={Position.Right} />
  </article>
})
