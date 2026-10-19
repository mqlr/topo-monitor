'use client'

import { useState } from 'react'
import { Activity, Bell, ChevronDown, ChevronRight, Eye, LayoutGrid, Maximize2, Network, Pencil, Plus, Search, Server, Settings2, ShieldCheck, Workflow, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopologyEditor } from '@/components/topology/topology-editor'
import { cn } from '@/lib/utils'

type View = { id: string; name: string; description: string; updated: string; status: '正常' | '关注' | '告警'; nodes: number; accent: string }
type Task = { id: string; name: string; group: string; count: number; views: View[] }

const tasks: Task[] = [
  { id: 'commerce', name: '电商业务全链路监控', group: '业务系统', count: 6, views: [
    { id: 'overview', name: '全链路总览', description: '订单、支付与基础设施运行态势', updated: '刚刚更新', status: '告警', nodes: 12, accent: '#5a8eff' },
    { id: 'order', name: '订单核心链路', description: '订单服务到数据库的核心依赖', updated: '2 分钟前', status: '关注', nodes: 8, accent: '#51c5aa' },
    { id: 'infra', name: '基础设施视图', description: 'Kafka、Redis、数据库与服务器', updated: '5 分钟前', status: '正常', nodes: 16, accent: '#a6d6a1' },
  ] },
  { id: 'marketing', name: '营销活动监控', group: '业务系统', count: 3, views: [{ id: 'campaign', name: '活动流量总览', description: '活动期间流量与服务健康度', updated: '今天 09:42', status: '正常', nodes: 9, accent: '#8a7dff' }] },
  { id: 'data', name: '数据平台监控', group: '数据平台', count: 4, views: [{ id: 'pipeline', name: '数据管道总览', description: 'ETL、任务队列与数据质量', updated: '今天 08:16', status: '正常', nodes: 11, accent: '#efbc66' }] },
]

function MiniTopology({ view, active, onClick }: { view: View; active: boolean; onClick: () => void }) {
  const lines = [[16, 30, 55, 30], [55, 30, 83, 18], [55, 30, 83, 43], [83, 18, 113, 18], [83, 43, 113, 43], [113, 18, 139, 30], [113, 43, 139, 30]]
  return <button className={cn('view-card', active && 'active')} onClick={onClick} aria-label={`切换到${view.name}`}>
    <div className="view-card-preview" style={{ '--view-accent': view.accent } as React.CSSProperties}>
      <svg viewBox="0 0 155 60" aria-hidden="true"><g className="mini-lines">{lines.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />)}</g>{[16, 55, 83, 113, 139].map((x, i) => <rect key={i} x={x - 7} y={i === 2 ? 23 : i > 2 ? (i === 3 ? 11 : 36) : 23} width="14" height="14" rx="3" className={cn('mini-node', i === 2 && 'focus')} />)}</svg><span className="preview-zoom"><Maximize2 /></span></div>
    <div className="view-card-body"><div className="view-card-title"><strong>{view.name}</strong><span className={cn('view-status', view.status === '告警' && 'danger', view.status === '关注' && 'warn')}><i />{view.status}</span></div><p>{view.description}</p><div className="view-card-meta"><span><Network />{view.nodes} 个监控节点</span><span>{view.updated}</span></div></div>
  </button>
}

export function MonitorView() {
  const [selectedTask, setSelectedTask] = useState('commerce')
  const [selectedView, setSelectedView] = useState('overview')
  const [designing, setDesigning] = useState(false)
  const [query, setQuery] = useState('')
  const task = tasks.find(item => item.id === selectedTask) ?? tasks[0]
  const visibleTasks = tasks.filter(item => item.name.includes(query))
  if (designing) return <div className="design-overlay"><button className="design-close" onClick={() => setDesigning(false)} aria-label="关闭拓扑设计器"><X /> 返回监控视图</button><TopologyEditor /></div>
  return <div className="nexus-app monitoring-app">
    <header className="global-header"><a className="brand" href="/" aria-label="NEXUS 首页"><span className="brand-mark"><Network size={23} /></span><strong>NEXUS<span>观测无界</span></strong></a><nav className="global-nav" aria-label="主导航"><button>工作台</button><button>拓扑编排</button><button className="active">监控视图</button><button>数据中心</button><button>告警中心<i /></button></nav><div className="global-header-right"><span className="workspace-name">默认工作空间 <ChevronDown size={13} /></span><span className="header-divider" /><button className="notification-button" aria-label="查看告警"><Bell size={18} /><i /></button><button className="avatar" aria-label="用户信息">L</button></div></header>
    <div className="app-body"><nav className="icon-rail" aria-label="工作空间工具"><div className="rail-top"><button aria-label="工作台"><LayoutGrid /></button><button aria-label="拓扑编排"><Workflow /></button><button className="active" aria-label="监控视图"><Eye /></button><button aria-label="数据源管理"><Server /></button><button aria-label="告警中心"><ShieldCheck /></button></div><div className="rail-bottom"><button aria-label="设置"><Settings2 /></button><span className="rail-avatar">LX</span></div></nav>
      <main className="monitor-main"><div className="monitor-page-header"><div><div className="breadcrumbs"><span>观测中心</span><ChevronRight size={12} /><span>监控视图</span></div><div className="monitor-title"><div className="monitor-title-icon"><Eye /></div><div><h1>监控视图</h1><p>按业务任务组织拓扑视图，快速掌握系统运行态势。</p></div></div></div><Button onClick={() => setDesigning(true)}><Pencil data-icon="inline-start" />设计拓扑</Button></div>
        <div className="monitor-content"><aside className="task-sidebar"><div className="task-sidebar-heading"><div><span className="eyebrow">MONITORING TASKS</span><h2>任务列表 <Badge variant="secondary">{tasks.length}</Badge></h2></div><button className="add-task" aria-label="创建监控任务"><Plus /></button></div><div className="task-search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索任务" aria-label="搜索任务" /></div><div className="task-list">{visibleTasks.map(item => <button key={item.id} className={cn('task-item', selectedTask === item.id && 'active')} onClick={() => { setSelectedTask(item.id); setSelectedView(item.views[0].id) }}><span className="task-icon"><Activity /></span><span className="task-item-copy"><strong>{item.name}</strong><small>{item.group} · {item.count} 个视图</small></span><ChevronRight /></button>)}</div><div className="task-sidebar-footer"><span><Activity />实时同步已开启</span><button aria-label="任务设置"><Settings2 /></button></div></aside>
          <section className="views-section"><div className="views-heading"><div><span className="eyebrow">{task.group.toUpperCase()} / VIEWS</span><h2>{task.name}</h2><p>共 {task.views.length} 个视图 · 最后同步于刚刚</p></div><div className="view-actions"><Button variant="outline"><LayoutGrid data-icon="inline-start" />排序</Button><Button variant="outline"><Plus data-icon="inline-start" />新建视图</Button></div></div><div className="views-grid">{task.views.map(view => <MiniTopology key={view.id} view={view} active={selectedView === view.id} onClick={() => setSelectedView(view.id)} />)}<button className="new-view-card"><span><Plus /></span><strong>创建新视图</strong><small>从空白画布开始编排</small></button></div><div className="selected-preview"><div className="selected-preview-header"><div><span className="eyebrow">LIVE PREVIEW</span><h2>{task.views.find(v => v.id === selectedView)?.name ?? task.views[0].name}</h2></div><div className="preview-toolbar"><span className="live-pill"><i />实时预览</span><Button variant="outline" size="sm" onClick={() => setDesigning(true)}><Pencil data-icon="inline-start" />编辑此视图</Button></div></div><div className="large-preview"><div className="large-grid" /><div className="preview-flow"><span className="flow-node node-a"><Activity />订单服务<small>1,286 req/s</small></span><span className="flow-line line-a" /><span className="flow-node node-b"><Network />Kafka 集群<small>2,420 msg/s</small></span><span className="flow-line line-b" /><span className="flow-node node-c"><Server />PostgreSQL<small>健康 · 42 ms</small></span><span className="flow-alert"><Bell />3 项告警</span></div><div className="large-preview-footer"><span>视图缩放 68%</span><span>最近刷新 12:42:08</span></div></div></div></section></div></main></div><div className="monitor-toast"><Activity />监控视图已加载 · {task.name}</div></div>
}
