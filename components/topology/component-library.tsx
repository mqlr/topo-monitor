'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Database, Grip, Info, Plus, Search, Box, Layers, CircleHelp, X } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { nodeIcons } from './topology-node'
import type { Dataset, NodeKind, TopologyNode } from '@/lib/topology'
import { cn } from '@/lib/utils'

const groups: { title: string; items: { kind: NodeKind; label: string }[] }[] = [
  { title: '基础组件', items: [{ kind: 'text', label: '文本' }, { kind: 'metric', label: '指标卡片' }, { kind: 'table', label: '数据表格' }, { kind: 'gateway', label: '网络网关' }] },
  { title: '监控组件', items: [{ kind: 'service', label: '应用服务' }, { kind: 'server', label: '服务器' }, { kind: 'database', label: '数据库' }, { kind: 'cache', label: 'Redis 缓存' }, { kind: 'queue', label: '消息队列' }, { kind: 'gateway', label: 'API 接口' }] },
]
export function ComponentLibrary({ onAdd, onSources, datasets, nodes, selected, onSelect, onHelp, onClose }: { onClose: () => void; onAdd: (kind: NodeKind, label: string) => void; onSources: () => void; datasets: Dataset[]; nodes: TopologyNode[]; selected: string; onSelect: (id: string) => void; onHelp: () => void }) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<string[]>([])
  return <aside className="component-library">
    <div className="mobile-panel-heading"><span>组件库</span><button onClick={onClose} aria-label="关闭组件库"><X size={18} /></button></div>
    <Tabs defaultValue="components" className="h-full gap-0">
      <TabsList variant="line" className="panel-tabs"><TabsTrigger value="components">组件库</TabsTrigger><TabsTrigger value="datasets">数据集</TabsTrigger><TabsTrigger value="layers">图层</TabsTrigger></TabsList>
      <div className="library-search"><Search size={16} /><Input aria-label="搜索组件或数据集" placeholder="搜索组件或数据集" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <TabsContent value="components" className="library-content">
        <div className="library-instruction"><Grip size={14} />拖拽组件至画布，开始编排</div>
        {groups.map(group => <section className="library-group" key={group.title}>
          <button className="group-title" onClick={() => setCollapsed(c => c.includes(group.title) ? c.filter(x => x !== group.title) : [...c, group.title])}><span>{group.title}</span>{collapsed.includes(group.title) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button>
          {!collapsed.includes(group.title) && <div className="component-grid">{group.items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())).map((item, index) => { const Icon = nodeIcons[item.kind]; return <button key={index} className="component-tile" draggable onDragStart={e => { e.dataTransfer.setData('application/topology', JSON.stringify(item)); e.dataTransfer.effectAllowed = 'copy' }} onClick={() => onAdd(item.kind, item.label)} title={`拖拽或点击添加${item.label}`}><span className="component-symbol"><Icon size={25} strokeWidth={1.4} /></span><span>{item.label}</span></button> })}</div>}
        </section>)}
        <section className="library-group"><button className="group-title" onClick={onSources}><span>自定义组件</span><Plus size={15} /></button><div className="custom-component"><Box size={19} /><span>绑定数据，赋予组件生命力</span></div></section>
        <div className="library-tip"><span className="tip-icon"><Info size={17} /></span><div><strong>让每一条数据，都有迹可循</strong><p>连接数据源，拖拽构建你的专属业务监控视图。</p><button onClick={onSources}>配置数据源 <ChevronRight size={14} /></button></div></div>
      </TabsContent>
      <TabsContent value="datasets" className="library-content"><div className="flex items-center justify-between p-4"><span className="text-muted-foreground">演示数据集 · {datasets.length}</span><Button size="icon-sm" variant="ghost" onClick={onSources} aria-label="新增数据源"><Plus /></Button></div>{datasets.filter(d => d.name.includes(query)).map(d => <button className="dataset-item" key={d.id} onClick={onSources}><Database size={18} /><span><strong>{d.name}</strong><small>{d.type} · {Object.keys(d.fields).length} 个字段</small></span><i className="live-dot" /></button>)}</TabsContent>
      <TabsContent value="layers" className="library-content"><div className="p-4 text-muted-foreground">画布组件 · {nodes.length}</div>{nodes.filter(n => n.data.label.includes(query)).map(n => <button key={n.id} className={cn('dataset-item', selected === n.id && 'active')} onClick={() => onSelect(n.id)}><Layers size={17} /><span>{n.data.label}</span><span className={cn('small-status', `status-${n.data.status}`)} /></button>)}</TabsContent>
      <div className="library-bottom"><CircleHelp size={16} /><button onClick={onHelp}>快速上手指南</button><span>↗</span></div>
    </Tabs>
  </aside>
}
