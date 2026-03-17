# THEMACHINE 官网视觉特效规范
**游戏风格 + 赛博朋克**

---

## 🎮 设计理念

> "这不是一个网站，这是一个沉浸式游戏。"

让访问者感觉不是在浏览网页，而是在**操控一个未来世界的 AI 监控系统**。

---

## 一、粒子系统

### 1. 背景粒子场

```javascript
// 粒子配置
const particleConfig = {
  count: 200,           // 粒子数量
  speed: 0.5,           // 移动速度
  size: [1, 4],         // 粒子大小范围
  color: [
    '#C9A227',          // 金色
    '#FFD700',          // 高亮金
    '#00FF41',          // 矩阵绿
    '#0A0A0F'           // 黑色(低透明度)
  ],
  connection: true,     // 粒子连线
  connectionDistance: 150,  // 连线距离
  opacity: [0.1, 0.6]  // 透明度范围
};
```

### 2. 全视之眼粒子

```
                    ╭─────────────────────╮
                   │    ◉  THE MACHINE    │
                  ╱│    ╭──────────╮     │╲
                 ╱ │    │ ●     ● │     │╲
                ╱  │    │  ●   ●  │     │╲
               ╱   │    │ ●  ●  ● │     │╲
              │────┼────│ ● ● ● ● │─────││
              │    │    ╰──────────╯     ││
              ╰────╯──────────────────────╯╯
                    ╲     ◉ ◉ ◉     ╱
                      ╲   ◉ ◉ ╱
                        ╲ ╱
                          ◉
                          
              ↑ 眼睛周围环绕粒子光环
```

- 瞳孔发射金色粒子
- 环绕眼睛的光圈粒子
- 眨眼时粒子爆发

### 3. 点击爆发效果

```javascript
// 点击时粒子爆发
function clickExplosion(x, y) {
  const particleCount = 30;
  const particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1,
      color: Math.random() > 0.5 ? '#FFD700' : '#00FF41'
    });
  }
  // 60帧动画后消失
}
```

---

## 二、光晕效果 (Glow)

### 1. 霓虹边框

```css
/* 金色霓虹 */
.neon-gold {
  border: 1px solid #C9A227;
  box-shadow: 
    0 0 5px #C9A227,
    0 0 10px #C9A227,
    0 0 20px #C9A227,
    0 0 40px rgba(201, 162, 39, 0.3);
}

/* 绿色数据流 */
.neon-green {
  border: 1px solid #00FF41;
  box-shadow: 
    0 0 5px #00FF41,
    0 0 10px #00FF41,
    inset 0 0 20px rgba(0, 255, 65, 0.1);
}
```

### 2. 按钮光晕

```css
.btn-glow {
  position: relative;
  background: linear-gradient(135deg, #1A1A2E, #0A0A0F);
  border: 1px solid #C9A227;
  overflow: hidden;
}

.btn-glow::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 215, 0, 0.1),
    transparent
  );
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}
```

### 3. 文字光晕

```css
.text-glow {
  text-shadow: 
    0 0 5px #FFD700,
    0 0 10px #FFD700,
    0 0 20px #C9A227,
    0 0 40px rgba(255, 215, 0, 0.5);
}
```

---

## 三、动态背景

### 1. 网格扫描背景

```
┌─────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ████████████████SCAN███████████████░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────┘
                    ↑ 扫描线移动效果
```

```css
.scan-line {
  position: fixed;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    #00FF41, 
    transparent
  );
  animation: scanMove 4s linear infinite;
  z-index: 100;
}

@keyframes scanMove {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
```

### 2. 数字雨背景

```
  0101101011101010    1110010101011100    0010111010101011
  1011011101010101    0101011100101011    1010101101011100
  0110101011101010    1011101010101101    0101011101010010
       ↑ 像黑客帝国一样的绿色数字流
```

### 3. 雷达扫描效果

```
              ╭─────────────────────╮
             ╱  ╭───╮     ╭───╮      ╲
            │   │   │     │   │       │
            │   ╰───╯  ●  ╰───╯       │
             ╲    ╭───╮     ╭───╮     ╱
              ╰───╯     ╰───╯    ╰────╯
                    ↑ 雷达旋转扫描
```

```css
.radar-scan {
  position: relative;
  width: 300px;
  height: 300px;
  border: 2px solid #00FF41;
  border-radius: 50%;
}

.radar-scan::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 2px;
  background: linear-gradient(90deg, #00FF41, transparent);
  transform-origin: left center;
  animation: radarRotate 3s linear infinite;
}

@keyframes radarRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 四、UI 动画

### 1. 卡片悬浮效果

```css
.card-3d {
  transform-style: preserve-3d;
  transition: all 0.3s ease;
}

.card-3d:hover {
  transform: 
    translateY(-10px)
    rotateX(5deg)
    rotateY(-5deg);
  box-shadow: 
    20px 20px 40px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(201, 162, 39, 0.3);
}
```

### 2. 数据滚动效果

```
┌─────────────────────────────┐
│  DETECTED: 0008291          │  ← 数字从 0000000 滚动
│  THREATS:   001337          │  ← 数字从 0000000 滚动
│  PREDICTED: 000047          │
└─────────────────────────────┘
```

```javascript
// 数字滚动动画
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = String(Math.floor(current)).padStart(7, '0');
  }, 16);
}
```

### 3. 进度条动画

```
████████████░░░░░░░░░░░  67%
    ↑ 扫描线样式，带脉冲发光
```

```css
.progress-glow {
  background: linear-gradient(90deg, 
    #00FF41 0%, 
    #00FF41 50%, 
    #00FF41 100%
  );
  box-shadow: 0 0 10px #00FF41;
  animation: progressPulse 2s ease-in-out infinite;
}

@keyframes progressPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### 4. 菜单悬停效果

```
┌─────────────────────────────────────┐
│  [⚡] DASHBOARD    → 展开子菜单     │
│  [👁] RADAR                          │
│  [🎯] TARGETS    → 展开子菜单       │
│  [⚙] SETTINGS                       │
└─────────────────────────────────────┘
```

```css
.menu-item {
  position: relative;
  transition: all 0.2s ease;
}

.menu-item::before {
  content: '▶';
  position: absolute;
  left: -20px;
  opacity: 0;
  color: #FFD700;
  transform: scale(0);
  transition: all 0.2s ease;
}

.menu-item:hover::before {
  left: -15px;
  opacity: 1;
  transform: scale(1);
}
```

---

## 五、交互特效

### 1. 鼠标跟随效果

```javascript
// 鼠标光标后跟随机粒子
document.addEventListener('mousemove', (e) => {
  createParticle(e.clientX, e.clientY);
});
```

### 2. 元素入场动画

```css
/* 从各个方向飞入 */
@keyframes flyInFromTop {
  from { 
    transform: translateY(-100px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

@keyframes flyInFromLeft {
  from { 
    transform: translateX(-100px); 
    opacity: 0; 
  }
  to { 
    transform: translateX(0); 
    opacity: 1; 
  }
}

/* 交错入场 */
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
```

### 3. 点击波纹效果

```css
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  background: rgba(255, 215, 0, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.ripple:active::after {
  width: 300px;
  height: 300px;
}
```

---

## 六、音效 (可选)

| 场景 | 音效 | 风格 |
|------|------|------|
| 页面加载 | 电脑启动音 + 风扇 | 复古科技 |
| 按钮点击 | 机械键盘敲击 | 触感 |
| 发现痛点 | 扫描音效 | 科幻 |
| 数据更新 | 咔嗒咔嗒 | 机械 |
| 悬停 | 电流声 | 电子 |
| 菜单展开 | 液压声 | 游戏 |

---

## 七、性能优化

### 1. 粒子数量控制

```javascript
// 根据屏幕尺寸调整粒子数
function getParticleCount() {
  const width = window.innerWidth;
  if (width < 768) return 50;   // 移动端
  if (width < 1200) return 100; // 平板
  return 200;                    // 桌面
}
```

### 2. 动画帧率

```javascript
// 使用 requestAnimationFrame
function animate() {
  updateParticles();
  render();
  requestAnimationFrame(animate);
}

// 降级处理
if ('ontouchstart' in window) {
  // 移动端减少粒子
  particleCount = 50;
}
```

---

## 八、与基础设计融合

### 叠加顺序

```
┌─────────────────────────────────────┐
│ 1. 深渊黑背景 #0A0A0F              │
│ 2. 网格背景 + 扫描线               │
│ 3. 数字雨粒子层                    │
│ 4. 主要内容卡片                   │
│ 5. 鼠标跟随粒子                   │
│ 6. 扫描线覆盖层                   │
└─────────────────────────────────────┘
```

### 动效组合

| 页面 | 动效组合 |
|------|----------|
| 首页 | 眼睛动画 + 粒子 + 数字滚动 |
| 列表页 | 卡片入场 + 悬浮光晕 |
| 详情页 | 进度条 + 雷达扫描 |
| 交互时 | 点击爆发 + 波纹 |

---

## 九、技术选型

| 效果 | 库 |
|------|-----|
| 粒子系统 | Three.js / Pixi.js |
| 2D 动画 | Canvas API |
| UI 动画 | Framer Motion |
| 光晕 | CSS + GLSL Shader |
| 3D 效果 | Three.js |

---

## 十、总结

**游戏化元素：**
- [x] 粒子系统
- [x] 霓虹光晕
- [x] 扫描线背景
- [x] 数字雨
- [x] 雷达扫描
- [x] 3D 卡片悬浮
- [x] 数字滚动
- [x] 点击特效
- [x] 音效反馈

**效果：**
- 像在玩一款未来的 AI 监控游戏
- 每个交互都有反馈
- 视觉丰富但不杂乱
- 保持赛博朋克风格
