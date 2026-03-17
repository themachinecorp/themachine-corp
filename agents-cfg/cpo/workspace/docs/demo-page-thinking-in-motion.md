# THEMATHINK 产品演示页面 - Thinking in Motion

## 页面概览

| 属性 | 值 |
|------|-----|
| 页面名称 | Thinking in Motion - 产品演示 |
| 路由 | `/demo` |
| 目标 | 展示 THEMATHINK 思考过程，让用户参与 AI 思维 |
| 核心交互 | 输入问题 → 观看思维生长 → 探索思维网络 |

---

## 一、页面结构

```tsx
// app/demo/page.tsx
import { DemoHero } from '@/components/demo/DemoHero';
import { ThinkingCanvas } from '@/components/demo/ThinkingCanvas';
import { ThoughtNetwork } from '@/components/demo/ThoughtNetwork';
import { ComparisonSection } from '@/components/demo/ComparisonSection';

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <DemoHero />
      <ThinkingCanvas />
      <ThoughtNetwork />
      <ComparisonSection />
    </main>
  );
}
```

---

## 二、核心组件实现

### 2.1 DemoHero - 开场组件

```tsx
// components/demo/DemoHero.tsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const PRESET_QUESTION = "AI 会取代人类工作吗？";

export function DemoHero() {
  const [question, setQuestion] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [stage, setStage] = useState<'idle' | 'input' | 'thinking' | 'reveal'>('idle');

  const startDemo = () => {
    setQuestion(PRESET_QUESTION);
    setStage('input');
    
    // 模拟输入动画
    setTimeout(() => {
      setStage('thinking');
      setIsThinking(true);
      
      // 思考完成，触发思维展示
      setTimeout(() => {
        setStage('reveal');
      }, 5000);
    }, 1500);
  };

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* 粒子背景 */}
      <ParticleBackground />
      
      {/* 标题区 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
          Thinking in <span className="text-amber-400">Motion</span>
        </h1>
        <p className="text-xl text-gray-400">
          看见 AI 的思考过程
        </p>
      </motion.div>

      {/* 输入交互区 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: stage === 'idle' ? 1 : 0.5,
          scale: stage === 'idle' ? 1 : 0.95
        }}
        className="relative z-10 w-full max-w-2xl px-4"
      >
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="输入一个问题..."
            disabled={stage !== 'idle'}
            className="w-full px-6 py-4 text-xl bg-white/5 border border-white/10 
                     rounded-2xl text-white placeholder-gray-500
                     focus:outline-none focus:border-amber-400/50
                     transition-all duration-300"
          />
          
          {/* 开始按钮 */}
          {stage === 'idle' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startDemo}
              className="absolute right-3 top-1/2 -translate-y-1/2
                       px-6 py-2 bg-amber-400 text-black font-semibold
                       rounded-xl hover:bg-amber-300 transition-colors"
            >
              开始体验
            </motion.button>
          )}
        </div>

        {/* 预设问题提示 */}
        {stage === 'idle' && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500 mt-4"
          >
            试试：<span className="text-amber-400 cursor-pointer hover:underline" onClick={startDemo}>
              {PRESET_QUESTION}
            </span>
          </motion.p>
        )}
      </motion.div>

      {/* 思考进度指示器 */}
      {stage === 'thinking' && (
        <ThinkingProgress />
      )}
    </section>
  );
}
```

### 2.2 ThinkingCanvas - 思考画布（核心动画）

```tsx
// components/demo/ThinkingCanvas.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';

function ThinkingCore({ isActive }: { isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // 脉动动画
  useMemo(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  }, [isActive]);

  return (
    <group>
      {/* 核心球体 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>
      
      {/* 内核 */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      
      {/* 旋转环 */}
      <RotatingRing />
    </group>
  );
}

function RotatingRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.5, 0.02, 16, 100]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} />
    </mesh>
  );
}

function Particles({ count = 2000 }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 2;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#fbbf24"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export function ThinkingCanvas() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <ThinkingCore isActive={true} />
        <Particles count={2000} />
        <Bloom intensity={0.8} />
      </Canvas>
    </div>
  );
}
```

### 2.3 ThoughtNetwork - 思维网络（导图）

```tsx
// components/demo/ThoughtNetwork.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThoughtNode {
  id: string;
  label: string;
  content?: string;
  children?: ThoughtNode[];
  collapsed?: boolean;
}

const INITIAL_NETWORK: ThoughtNode[] = [
  {
    id: 'economic',
    label: '💰 经济维度',
    children: [
      { id: 'job-loss', label: '就业结构变化', content: '重复性工作将被替代，但新岗位会涌现' },
      { id: 'industry-change', label: '产业变革', content: '制造业、服务业将全面转型' },
      { id: 'new-opportunity', label: '新机会', content: 'AI 训练师、提示工程师等新职业' },
    ]
  },
  {
    id: 'tech',
    label: '🔬 技术维度',
    children: [
      { id: 'capability-limit', label: '能力边界', content: '当前 AI 仍缺乏真正的理解能力' },
      { id: 'dev-speed', label: '发展速度', content: '指数级增长，但存在物理极限' },
      { id: 'limitation', label: '局限性', content: '幻觉、偏见、推理错误等问题' },
    ]
  },
  {
    id: 'philosophy',
    label: '🤔 哲学维度',
    children: [
      { id: 'consciousness', label: '意识本质', content: '什么是真正的"理解"？' },
      { id: 'meaning', label: '存在意义', content: '人类工作的意义不仅是谋生' },
      { id: 'ethics', label: '伦理边界', content: 'AI 决策的责任归属问题' },
    ]
  },
];

export function ThoughtNetwork() {
  const [nodes, setNodes] = useState<ThoughtNode[]>(INITIAL_NETWORK);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  return (
    <section className="min-h-screen py-20 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          思维网络
        </h2>
        
        {/* 中心节点 */}
        <div className="flex justify-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 
                     rounded-2xl text-black font-bold text-xl"
          >
            ✦ 核心问题 ✦
          </motion.div>
        </div>

        {/* 一级分支 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              {/* 连接线 */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-amber-400/50" />
              
              {/* 节点按钮 */}
              <button
                onClick={() => toggleNode(node.id)}
                className="w-full p-4 bg-white/5 border border-white/10 
                         rounded-xl text-white text-left
                         hover:border-amber-400/50 hover:bg-white/10
                         transition-all"
              >
                <span className="text-lg">{node.label}</span>
                <motion.span
                  animate={{ rotate: expandedNodes.has(node.id) ? 180 : 0 }}
                  className="inline-block ml-2"
                >
                  ▼
                </motion.span>
              </button>

              {/* 子节点 */}
              <AnimatePresence>
                {expandedNodes.has(node.id) && node.children && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-2 pl-4"
                  >
                    {node.children.map((child) => (
                      <motion.div
                        key={child.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 bg-white/5 rounded-lg cursor-pointer
                                 hover:bg-white/10 transition-colors"
                      >
                        <div className="text-white text-sm font-medium">
                          {child.label}
                        </div>
                        {child.content && (
                          <div className="text-gray-400 text-xs mt-1">
                            {child.content}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
```

### 2.4 ComparisonSection - 对比展示

```tsx
// components/demo/ComparisonSection.tsx
'use client';

import { motion } from 'framer-motion';

export function ComparisonSection() {
  return (
    <section className="py-20 px-4 bg-black/20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          不只是搜索答案
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* 传统搜索 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl"
          >
            <h3 className="text-xl text-red-400 font-bold mb-4">
              ❌ 传统搜索引擎
            </h3>
            <ul className="space-y-3">
              {[
                '碎片化信息',
                '需要自己整合',
                '没有深度分析',
                '缺乏多维视角',
                '只给你"答案"',
              ].map((item, i) => (
                <li key={i} className="text-gray-400 flex items-center gap-2">
                  <span className="text-red-400">○</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* THEMATHINK */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl"
          >
            <h3 className="text-xl text-amber-400 font-bold mb-4">
              ✅ THEMATHINK
            </h3>
            <ul className="space-y-3">
              {[
                '结构化思考',
                '多维分析视角',
                '深度洞察洞察',
                '哲学思辨',
                '帮你"思考"',
              ].map((item, i) => (
                <li key={i} className="text-gray-400 flex items-center gap-2">
                  <span className="text-amber-400">●</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mt-12"
        >
          <button className="px-8 py-4 bg-amber-400 text-black 
                           font-bold text-lg rounded-xl
                           hover:bg-amber-300 transition-colors
                           shadow-lg shadow-amber-400/20">
            开始你的思考之旅 →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
```

---

## 三、样式配置

### 3.1 Tailwind 配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'deep-space': '#0a0a1a',
        'star-white': '#f0f0ff',
        'amber-glow': '#fbbf24',
        'mint-accent': '#34d399',
        'philosophy-purple': '#a78bfa',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 0.5, scale: 1 },
          '50%': { opacity: 1, scale: 1.05 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
};
```

### 3.2 全局样式

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --deep-space: #0a0a1a;
  --amber-glow: #fbbf24;
}

body {
  background: var(--deep-space);
  color: white;
}

/* 粒子效果容器 */
.thinking-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
}

/* 文字发光效果 */
.text-glow {
  text-shadow: 0 0 20px var(--amber-glow);
}

/* 卡片玻璃效果 */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 四、页面完整代码

### 4.1 主页面

```tsx
// app/demo/page.tsx
import { DemoHero } from '@/components/demo/DemoHero';
import { ThinkingCanvas } from '@/components/demo/ThinkingCanvas';
import { ThoughtNetwork } from '@/components/demo/ThoughtNetwork';
import { ComparisonSection } from '@/components/demo/ComparisonSection';
import { CTASection } from '@/components/demo/CTASection';

export const metadata = {
  title: 'Thinking in Motion | THEMATHINK',
  description: '看见 AI 的思考过程 - 哲学级 AI 思考助手',
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      {/* 背景粒子层 */}
      <div className="fixed inset-0 -z-10">
        <ThinkingCanvas />
      </div>
      
      {/* 主内容 */}
      <DemoHero />
      <ThoughtNetwork />
      <ComparisonSection />
      <CTASection />
    </main>
  );
}
```

### 4.2 CTA 区域

```tsx
// components/demo/CTASection.tsx
'use client';

import { motion } from 'framer-motion';

export function CTASection() {
  return (
    <section className="py-20 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-4xl font-bold text-white mb-6">
          让思考更有<span className="text-amber-400">深度</span>
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          THEMATHINK 不只是给你答案，而是帮你更好地思考
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-amber-400 text-black 
                           font-bold rounded-xl
                           hover:bg-amber-300 transition-colors">
            立即开始使用
          </button>
          <button className="px-8 py-4 border border-white/20 text-white 
                           font-bold rounded-xl
                           hover:bg-white/10 transition-colors">
            了解更多
          </button>
        </div>
      </motion.div>
    </section>
  );
}
```

---

## 五、文件结构

```
app/
├── demo/
│   └── page.tsx          # 演示页面入口
├── globals.css           # 全局样式
├── layout.tsx            # 根布局
└── page.tsx              # 首页（包含演示入口）

components/
└── demo/
    ├── DemoHero.tsx           # 开场 + 输入
    ├── ThinkingCanvas.tsx     # 3D 粒子背景
    ├── ThoughtNetwork.tsx     # 思维导图
    ├── ComparisonSection.tsx  # 对比展示
    └── CTASection.tsx         # 行动召唤
```

---

## 六、依赖安装

```bash
npm install three @react-three/fiber @react-three/drei
npm install framer-motion
npm install -D @types/three
```

---

## 七、交互流程

```
1. 访问 /demo
      ↓
2. Hero 区域：粒子背景 + 标题
      ↓
3. 点击"开始体验"或预设问题
      ↓
4. 思考动画：核心脉动 + 粒子扩散（5秒）
      ↓
5. 思维导图展开：三个维度分支
      ↓
6. 用户可点击展开子节点
      ↓
7. 对比展示：传统 vs THEMATHINK
      ↓
8. CTA：注册引导
```

---

*页面实现完成：2026-03-12*
*设计者：CPO Sarah*
