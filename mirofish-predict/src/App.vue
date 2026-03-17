<template>
  <div class="app">
    <header>
      <h1>🤖 Predict Engine</h1>
      <p>AI-Powered Multi-Agent Prediction System</p>
    </header>
    
    <div class="steps">
      <div class="step" :class="{ active: step >= 1 }">
        <div class="step-num">1</div>
        <div class="step-title">Graph Build</div>
      </div>
      <div class="step" :class="{ active: step >= 2 }">
        <div class="step-num">2</div>
        <div class="step-title">Environment</div>
      </div>
      <div class="step" :class="{ active: step >= 3 }">
        <div class="step-num">3</div>
        <div class="step-title">Simulation</div>
      </div>
      <div class="step" :class="{ active: step >= 4 }">
        <div class="step-num">4</div>
        <div class="step-title">Report</div>
      </div>
      <div class="step" :class="{ active: step >= 5 }">
        <div class="step-num">5</div>
        <div class="step-title">Interaction</div>
      </div>
    </div>
    
    <div class="content">
      <div class="panel">
        <h2>Step {{ step }}: {{ stepNames[step-1] }}</h2>
        <p v-if="step === 1">Upload seed materials (documents/URLs/text) and AI will extract entities and build a knowledge graph.</p>
        <p v-if="step === 2">Configure simulation parameters, set agent count, define time range.</p>
        <p v-if="step === 3">Multi-agent interaction simulation with real-time progress.</p>
        <p v-if="step === 4">AI analyzes results and generates prediction report.</p>
        <p v-if="step === 5">Explore the graph interactively, view node details.</p>
        
        <textarea v-model="input" placeholder="Enter your prediction topic or paste text..."></textarea>
        
        <button @click="nextStep" class="btn-primary">
          {{ step === 5 ? 'Start Over' : 'Next Step →' }}
        </button>
      </div>
      
      <div class="panel graph-panel">
        <h3>Knowledge Graph</h3>
        <div class="graph-viz">
          <div class="node" v-for="(node, i) in nodes" :key="i" 
               :style="{ left: node.x + 'px', top: node.y + 'px', background: node.color }">
            {{ node.label }}
          </div>
          <svg class="edges">
            <line v-for="(edge, i) in edges" :key="i"
                  :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const step = ref(1)
const stepNames = ['Graph Build', 'Environment Setup', 'Simulation', 'Report', 'Interaction']
const input = ref('')

const nodes = ref([
  { label: 'Topic', x: 150, y: 100, color: '#00ffcc' },
  { label: 'Entity A', x: 80, y: 200, color: '#ff0066' },
  { label: 'Entity B', x: 220, y: 200, color: '#ffcc00' },
  { label: 'Entity C', x: 150, y: 300, color: '#00aaff' }
])

const edges = ref([
  { x1: 150, y1: 130, x2: 80, y2: 170 },
  { x1: 150, y1: 130, x2: 220, y2: 170 },
  { x1: 80, y1: 230, x2: 150, y2: 270 },
  { x1: 220, y1: 230, x2: 150, y2: 270 }
])

function nextStep() {
  if (step.value < 5) step.value++
  else step.value = 1
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #000; color: #fff; font-family: system-ui; }
.app { min-height: 100vh; padding: 20px; }

header { text-align: center; margin-bottom: 40px; }
header h1 { font-size: 36px; color: #00ffcc; margin-bottom: 8px; }
header p { color: #666; }

.steps { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; }
.step { display: flex; align-items: center; gap: 8px; opacity: 0.3; }
.step.active { opacity: 1; }
.step-num { width: 32px; height: 32px; border-radius: 50%; background: #222; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.step.active .step-num { background: #00ffcc; color: #000; }
.step-title { font-size: 14px; }

.content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.panel { background: #0a0a0a; border: 1px solid #222; border-radius: 12px; padding: 24px; }
.panel h2 { color: #00ffcc; margin-bottom: 12px; }
.panel h3 { color: #666; margin-bottom: 16px; font-size: 14px; text-transform: uppercase; }
.panel p { color: #888; margin-bottom: 20px; line-height: 1.6; }

textarea { width: 100%; height: 120px; background: #111; border: 1px solid #333; border-radius: 8px; padding: 12px; color: #fff; font-size: 14px; margin-bottom: 16px; }
.btn-primary { background: #00ffcc; color: #000; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; }

.graph-viz { position: relative; height: 400px; background: #050505; border-radius: 8px; }
.node { position: absolute; padding: 8px 16px; border-radius: 20px; font-size: 12px; color: #000; font-weight: bold; }
.edges { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
line { stroke: #333; stroke-width: 1; }
</style>
