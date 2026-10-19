'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, MiniMap, useNodesState, useEdgesState, useReactFlow, useViewport, addEdge, type Connection, type XYPosition } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Activity, ArrowLeft, Bell, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, Copy, Database, Download, Expand, Eye, GitBranch, Grid2X2, Hand, Layers, LayoutDashboard, Maximize, Minus, MousePointer2, Network, PanelLeftClose, Play, Plus, Radio, Redo2, Save, Settings, ShieldCheck, Undo2, Workflow, X, ZoomIn, Trash2, Cable, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { ServiceNode, kindNames } from './topology-node'
import { ComponentLibrary } from './component-library'
import { Inspector } from './inspector'
import { EditorDialogs, type DialogMode } from './editor-dialogs'
import { MonitorPanel } from './monitor-panel'
import { datasets as initialDatasets, initialNodes, initialEdges, defaultRule, evaluateExpression, expressionValues, statusForValue, statusColors, type Dataset, type ItemData, type NodeKind, type TopologyNode, type TopologyEdge } from '@/lib/topology'
import { cn } from '@/lib/utils'

const nodeTypes = { service: ServiceNode }
const canvasPadding = { top: '54px', right: '30px', bottom: '100px', left: '30px' } as const
type Snapshot = { nodes: TopologyNode[]; edges: TopologyEdge[] }

function Editor({ readOnly = false }: { readOnly?: boolean }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<TopologyNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<TopologyEdge>(initialEdges)
  const [datasets, setDatasets] = useState(initialDatasets)
  const [selected, setSelected] = useState('order')
  const [mode, setMode] = useState<DialogMode>(null)
  const [objectId, setObjectId] = useState('order-app')
  const [preview, setPreview] = useState(false)
  const [hand, setHand] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showLibrary, setShowLibrary] = useState(true)
  const [showInspector, setShowInspector] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<'library' | 'inspector' | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [monitorTab, setMonitorTab] = useState('alerts')
  const [exported, setExported] = useState(false)
  const [historyTick, setHistoryTick] = useState(0)
  const [ready, setReady] = useState(false)
  const history = useRef<Snapshot[]>([])
  const future = useRef<Snapshot[]>([])
  const shellRef = useRef<HTMLDivElement>(null)
  const flow = useReactFlow<TopologyNode, TopologyEdge>()
  const { zoom } = useViewport()
  const canvasRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ready || !canvasRef.current) return
    let timer: ReturnType<typeof setTimeout>
    let disposed = false
    const fit = () => { if (disposed) return; clearTimeout(timer); timer = setTimeout(() => flow.fitView({ padding: canvasPadding, duration: 0 }), 100) }
    const observer = new ResizeObserver(fit)
    observer.observe(canvasRef.current)
    void document.fonts.ready.then(fit)
    return () => { disposed = true; observer.disconnect(); clearTimeout(timer) }
  }, [flow, ready])
  const selectedNode = nodes.find(n => n.id === selected)
  const selectedEdge = edges.find(e => e.id === selected)
  const selectedData = selectedNode?.data || selectedEdge?.data
  const alertsCount = [...nodes, ...edges].filter(n => n.data && n.data.rule.enabled && ['warning', 'critical'].includes(n.data.status)).length
  const checkpoint = useCallback(() => { history.current = [...history.current.slice(-39), structuredClone({ nodes, edges })]; future.current = []; setHistoryTick(v => v + 1); setExported(false) }, [nodes, edges])
  const select = (id: string) => { setSelected(id); setNodes(ns => ns.map(n => ({ ...n, selected: n.id === id }))); setEdges(es => es.map(e => ({ ...e, selected: e.id === id }))); if (!preview) { setShowInspector(true); if (window.matchMedia('(max-width: 640px)').matches) setMobilePanel('inspector') } }
  const updateData = (patch: Partial<ItemData>) => {
    checkpoint()
    let nextNodes = nodes.map(n => n.id === selected ? { ...n, data: { ...n.data, ...patch } } : n)
    let nextEdges = edges.map(e => e.id === selected && e.data ? { ...e, data: { ...e.data, ...patch } } : e)
    const values = expressionValues(nextNodes, datasets)
    const recompute = (d: ItemData): ItemData => { try { return { ...d, status: d.rule.enabled ? statusForValue(evaluateExpression(d.rule.expression, values), d.rule.thresholds) : 'healthy' } } catch { return d } }
    nextNodes = nextNodes.map(n => ({ ...n, data: recompute(n.data) }))
    nextEdges = nextEdges.map(e => { const data = e.data ? recompute(e.data) : undefined; return { ...e, data, style: { ...e.style, stroke: data ? statusColors[data.status] : 'var(--primary)' } } })
    setNodes(nextNodes); setEdges(nextEdges)
  }
  const addNode = (kind: NodeKind, label: string, position?: XYPosition) => {
    if (preview) return
    checkpoint()
    const id = `component_${Date.now()}`
    const node: TopologyNode = { id, type: 'service', position: position || { x: 200 + nodes.length * 12, y: 130 + nodes.length * 12 }, selected: true, data: { label, kind, subtitle: kindNames[kind], metric: '每秒请求数', value: 1286, unit: '次/秒', detail: '已绑定 · 订单业务指标', dataset: 'orders', field: 'total', bindings: [], status: 'healthy', rule: defaultRule() } }
    setNodes(ns => [...ns.map(n => ({ ...n, selected: false })), node]); setSelected(id); setShowInspector(true); toast.success(`已添加${label}`)
  }
  const onConnect = (connection: Connection) => {
    checkpoint()
    const source = nodes.find(n => n.id === connection.source)!
    const target = nodes.find(n => n.id === connection.target)!
    const data: ItemData = { ...source.data, label: `${source.data.label} → ${target.data.label}`, kind: 'gateway', bindings: [], subtitle: '业务连线' }
    setEdges(es => addEdge({ ...connection, type: 'smoothstep', animated: true, label: '数据流', data, style: { stroke: statusColors[data.status], strokeWidth: 1.6 }, labelStyle: { fill: 'var(--muted-foreground)' }, labelBgStyle: { fill: 'var(--canvas)' } }, es))
    toast.success('连线已创建，点击连线可配置告警和监控对象')
  }
  const undo = () => { const last = history.current.pop(); if (!last) return; future.current.push(structuredClone({ nodes, edges })); setNodes(last.nodes); setEdges(last.edges); setHistoryTick(v => v + 1); setExported(false) }
  const redo = () => { const next = future.current.pop(); if (!next) return; history.current.push(structuredClone({ nodes, edges })); setNodes(next.nodes); setEdges(next.edges); setHistoryTick(v => v + 1); setExported(false) }
  const removeSelected = () => { if (!selectedData) return; checkpoint(); setNodes(ns => ns.filter(n => n.id !== selected)); setEdges(es => es.filter(e => e.id !== selected && e.source !== selected && e.target !== selected)); setSelected(''); toast.success('已删除所选元素，可使用撤销恢复') }
  const duplicate = () => { if (!selectedNode) { toast.info('请先选择一个组件'); return }; checkpoint(); const id = `component_${Date.now()}`; setNodes(ns => [...ns.map(n => ({ ...n, selected: false })), { ...structuredClone(selectedNode), id, selected: true, position: { x: selectedNode.position.x + 40, y: selectedNode.position.y + 45 }, data: { ...structuredClone(selectedNode.data), label: `${selectedNode.data.label} 副本` } }]); setSelected(id) }
  const save = () => { const blob = new Blob([JSON.stringify({ version: 1, name: '电商业务全链路监控', demo: true, nodes, edges, datasets }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'nexus-topology.json'; a.click(); URL.revokeObjectURL(url); setExported(true); toast.success('画布配置已导出为 JSON 文件', { description: '原型不存储服务器数据，刷新前请保留导出文件。' }) }
  const inspectObject = (id: string) => { setObjectId(id); setMode('object') }
  const showMonitor = (tab: string) => { setMonitorTab(tab); setExpanded(true) }
  const fullscreen = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await shellRef.current?.requestFullscreen() } catch { toast.info('当前预览环境不支持全屏，请在新窗口中打开') } }
  return <div className="nexus-app font-sans" ref={shellRef} data-editor-ready={ready} data-history={historyTick}>
    <header className="global-header"><a className="brand" href="/" aria-label="NEXUS 首页"><span className="brand-mark"><Network size={23} strokeWidth={2.2} /></span><strong>NEXUS<span>观测无界</span></strong></a><nav className="global-nav" aria-label="主导航"><button onClick={() => setMode('help')}>工作台</button><button className="active" onClick={() => setPreview(false)}>拓扑编排</button><button onClick={() => setMode('sources')}>数据中心</button><button onClick={() => showMonitor('alerts')}>告警中心{alertsCount > 0 && <i />}</button></nav><div className="global-header-right"><span className="workspace-name">默认工作空间 <ChevronDown size={13} /></span><span className="header-divider" /><button className="documentation" onClick={() => setMode('help')}><BookOpen size={15} />使用文档</button><button className="notification-button" onClick={() => showMonitor('alerts')} aria-label="查看告警通知"><Bell size={18} /><i /></button><button className="avatar" onClick={() => setMode('help')} aria-label="工作空间信息">L</button></div></header>
    <div className="app-body"><nav className="icon-rail" aria-label="工作空间工具"><div className="rail-top"><button onClick={() => setMode('help')} aria-label="工作台"><LayoutDashboard /></button><button className="active" onClick={() => { setPreview(false); setShowLibrary(true) }} aria-label="拓扑编排"><Workflow /></button><button onClick={() => setMode('sources')} aria-label="数据源管理"><Database /></button><button onClick={() => showMonitor('objects')} aria-label="监控对象"><Layers /></button><button onClick={() => showMonitor('alerts')} aria-label="告警中心"><ShieldCheck /></button></div><div className="rail-bottom"><button onClick={() => setShowInspector(v => !v)} aria-label="切换配置面板"><Settings /></button><button onClick={() => setMode('help')} aria-label="帮助"><CircleHelp /></button><span className="rail-avatar">LX</span></div></nav>
    <main className="editor-main"><section className="project-header"><div className="project-heading"><div className="breadcrumbs"><span>拓扑编排</span><ChevronRight size={12} /><span>业务监控</span><ChevronRight size={12} /><span>电商业务全链路监控</span></div><div className="project-title-row"><h1>电商业务全链路监控</h1><Badge variant="outline">{preview ? '运行预览' : '编辑中'}</Badge><span className="project-version">v1.0</span></div><p className="project-description">连接业务与基础设施，实时感知每一处运行状态。</p></div><div className="project-actions"><span className="save-state"><Check size={14} />{exported ? '已导出配置' : '当前会话 · 演示原型'}</span><Button variant="outline" onClick={save}><Save data-icon="inline-start" />保存</Button><Button onClick={() => { setPreview(v => !v); toast.info(preview ? '已返回编辑模式' : '预览模式：点击组件或连线查看监控对象') }}>{preview ? <ArrowLeft data-icon="inline-start" /> : <Play data-icon="inline-start" />}{preview ? '返回编辑' : '预览运行'}</Button></div></section>
    <div className={cn('editor-workspace', preview && 'preview-mode', mobilePanel === 'library' && 'mobile-library', mobilePanel === 'inspector' && 'mobile-inspector')}>
      {!preview && !readOnly && showLibrary && <ComponentLibrary onClose={() => setMobilePanel(null)} onAdd={(kind, label) => { addNode(kind, label); setMobilePanel('inspector') }} onSources={() => setMode('sources')} datasets={datasets} nodes={nodes} selected={selected} onSelect={select} onHelp={() => setMode('help')} />}
      <div className={cn('canvas-column', readOnly && 'readonly-topology')}><div className="canvas-toolbar"><div className="toolbar-group"><button aria-label="切换组件库" title="切换组件库" onClick={() => { if (window.matchMedia('(max-width: 850px)').matches) { setShowLibrary(true); setMobilePanel(p => p === 'library' ? null : 'library') } else setShowLibrary(v => !v) }} disabled={preview || readOnly}><PanelLeftClose size={17} /></button><span className="toolbar-divider" /><button aria-label="选择工具" title="选择工具" className={cn(!hand && 'active')} onClick={() => setHand(false)}><MousePointer2 size={17} /></button><button aria-label="抓手工具" title="拖动画布" className={cn(hand && 'active')} onClick={() => setHand(true)}><Hand size={17} /></button><span className="toolbar-divider" /><button aria-label="撤销" title="撤销" onClick={undo} disabled={preview || !history.current.length}><Undo2 size={17} /></button><button aria-label="重做" title="重做" onClick={redo} disabled={preview || !future.current.length}><Redo2 size={17} /></button><span className="toolbar-divider" /><button aria-label="复制组件" title="复制组件" onClick={duplicate} disabled={preview || !selectedNode}><Copy size={16} /></button><button aria-label="删除所选元素" title="删除所选元素" onClick={removeSelected} disabled={preview || !selectedData}><Trash2 size={16} /></button><button aria-label="连接组件" title="连接组件" onClick={() => { setHand(false); toast.info('从组件右侧的圆形连接点拖至另一组件左侧，即可创建连线') }} disabled={preview}><GitBranch size={17} /></button></div><div className="toolbar-group"><button className={cn(showGrid && 'subtle-active')} onClick={() => setShowGrid(v => !v)} aria-label="切换画布网格" title="显示网格"><Grid2X2 size={16} /></button><button onClick={() => flow.fitView({ padding: canvasPadding, duration: 300 })} aria-label="适应画布" title="适应画布"><Maximize size={17} /></button><span className="toolbar-divider" /><button className="source-toolbar-button" aria-label="数据源配置" onClick={() => setMode('sources')}><Database size={15} /><span>数据源</span><span className="source-count">{new Set(datasets.map(d => d.source)).size}</span></button></div></div>
      <div className="topology-canvas" ref={canvasRef} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }} onDrop={e => { e.preventDefault(); const raw = e.dataTransfer.getData('application/topology'); if (!raw) return; try { const item = JSON.parse(raw); if (item.kind in kindNames && typeof item.label === 'string') addNode(item.kind, item.label, flow.screenToFlowPosition({ x: e.clientX, y: e.clientY })) } catch { toast.error('无法添加该组件') } }}>
        <div className="canvas-topline"><span><i className="live-dot" />业务拓扑视图</span><div><span>{nodes.length} 个组件</span><span>{edges.length} 条连线</span><span className="demo-label">DEMO</span></div></div>
        <ReactFlow<TopologyNode, TopologyEdge> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDragStart={checkpoint} onNodeClick={(_, n) => { select(n.id); if (preview) setMode('objects') }} onEdgeClick={(_, e) => { select(e.id); if (preview) setMode('objects') }} onNodeDoubleClick={(_, n) => { setSelected(n.id); setMode(preview ? 'objects' : 'bindings') }} onInit={() => setReady(true)} nodesDraggable={!preview} nodesConnectable={!preview} panOnDrag={hand ? true : [1, 2]} selectionOnDrag={!hand && !preview} deleteKeyCode={null} fitView fitViewOptions={{ padding: canvasPadding }} minZoom={0.25} maxZoom={1.6} colorMode="dark" proOptions={{ hideAttribution: true }} onlyRenderVisibleElements>
          {showGrid && <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--dot-grid)" />}
          <MiniMap nodeColor={n => statusColors[(n.data as ItemData).status]} nodeStrokeWidth={0} maskColor="var(--minimap-mask)" pannable zoomable position="bottom-right" ariaLabel="拓扑缩略图" />
        </ReactFlow>
        <div className="canvas-legend"><span className="status-healthy"><i />正常</span><span className="status-notice"><i />关注</span><span className="status-warning"><i />警告</span><span className="status-critical"><i />严重</span></div>
        <div className="canvas-bottom-controls"><div className="zoom-controls"><button aria-label="缩小画布" onClick={() => flow.zoomOut({ duration: 200 })}><Minus size={15} /></button><span className="font-mono">{Math.round(zoom * 100)}%</span><button aria-label="放大画布" onClick={() => flow.zoomIn({ duration: 200 })}><Plus size={15} /></button><span className="toolbar-divider" /><button onClick={() => flow.fitView({ padding: canvasPadding, duration: 250 })} aria-label="重置画布视图"><Expand size={15} /></button></div><button className="fullscreen-button" onClick={fullscreen} aria-label="全屏查看"><Maximize size={16} /></button></div>
      </div>
      <MonitorPanel nodes={nodes} edges={edges} datasets={datasets} onSelect={select} onObject={inspectObject} expanded={expanded} setExpanded={setExpanded} activeTab={monitorTab} onTab={setMonitorTab} />
      <footer className="canvas-statusbar"><span><Radio size={12} />演示引擎就绪<span className="statusbar-separator">|</span>数据刷新间隔 5 秒</span><span>拖拽编排 · 连线建立关联<span className="statusbar-separator">|</span><button onClick={() => setMode('help')}>快捷指南 <CircleHelp size={12} /></button></span></footer></div>
      {!preview && showInspector && (selectedData ? <Inspector onClose={() => { setMobilePanel(null); if (!window.matchMedia('(max-width: 640px)').matches) setShowInspector(false) }} key={selected} data={selectedData} isEdge={!!selectedEdge} datasets={datasets} nodes={nodes} onUpdate={updateData} onBind={() => setMode('bindings')} onObject={inspectObject} onDataset={() => setMode('sources')} /> : <aside className="inspector empty-inspector"><MousePointer2 size={30} /><h3>选择一个组件或连线</h3><p>在此配置数据绑定、告警策略与监控对象。</p></aside>)}
    </div></main></div>
    <EditorDialogs key={`${mode}-${selected}-${objectId}`} mode={mode} onClose={() => setMode(null)} data={selectedData} objectId={objectId} onObject={inspectObject} onBindings={bindings => updateData({ bindings })} onAddDataset={d => { setDatasets(ds => [...ds, d]); setExported(false) }} datasets={datasets} />
    <Toaster theme="dark" position="bottom-center" />
  </div>
}

export function TopologyEditor({ readOnly = false }: { readOnly?: boolean }) { return <ReactFlowProvider><Editor readOnly={readOnly} /></ReactFlowProvider> }
