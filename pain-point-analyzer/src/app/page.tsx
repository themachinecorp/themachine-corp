'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Download,
  RefreshCw
} from 'lucide-react';
import { analyzePainPoints, type AnalysisResult } from '@/lib/ai';

// 动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  const [productDesc, setProductDesc] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [dailyQuota] = useState(3);
  const [usedQuota] = useState(0);

  const handleAnalyze = async () => {
    if (!productDesc.trim() || !targetUsers.trim()) {
      setError('请填写产品描述和目标用户');
      return;
    }

    if (usedQuota >= dailyQuota) {
      setError('今日免费次数已用完，请升级付费版');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const analysisResult = await analyzePainPoints(productDesc, targetUsers);
      setResult(analysisResult);
    } catch (err) {
      setError('分析失败，请稍后重试');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-void relative overflow-hidden">
      {/* 扫描线效果 */}
      <div className="scanlines" />
      
      {/* 背景粒子效果 - 简化版 */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,162,39,0.1),transparent)]" />
      </div>

      <motion.div 
        className="container mx-auto px-4 py-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 头部 */}
        <motion.header variants={itemVariants} className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center">
              <span className="text-3xl">👁</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gold text-glow mb-4">
            PAIN POINT ANALYZER
          </h1>
          <p className="text-gray-400 text-lg">
            Discover what your users truly need.
          </p>
        </motion.header>

        {/* 输入区域 */}
        <motion.section variants={itemVariants} className="max-w-2xl mx-auto mb-12">
          <div className="bg-void-light border border-gold/30 rounded-lg p-6 neon-gold">
            <div className="space-y-4">
              <div>
                <label className="block text-gold mb-2 font-display">
                  产品/想法描述
                </label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder="例如：一个面向程序员的 AI 笔记应用"
                  className="w-full h-24 input-cyber rounded-lg p-4 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-gold mb-2 font-display">
                  目标用户
                </label>
                <input
                  type="text"
                  value={targetUsers}
                  onChange={(e) => setTargetUsers(e.target.value)}
                  placeholder="例如：软件开发者"
                  className="w-full h-12 input-cyber rounded-lg px-4"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-danger">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <div className="text-gray-400 text-sm">
                  剩余次数: <span className="text-gold font-bold">{dailyQuota - usedQuota}/{dailyQuota}</span>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="btn-glow px-8 py-3 rounded-lg font-display font-bold text-gold flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Brain size={20} />
                      分析痛点
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 结果展示 */}
        {result && (
          <motion.section 
            variants={itemVariants}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-void-light border border-matrix/30 rounded-lg p-6 neon-matrix">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="text-matrix" size={24} />
                <h2 className="text-xl font-display font-bold text-matrix">
                  分析结果
                </h2>
              </div>

              {/* 痛点列表 */}
              <div className="space-y-4 mb-6">
                {result.painPoints.map((pp, index) => (
                  <motion.div
                    key={pp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-void rounded-lg p-4 border border-void-light card-hover"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gold font-bold">#{index + 1}</span>
                        <span className="text-white">{pp.description}</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        pp.severity >= 80 ? 'text-danger' : 
                        pp.severity >= 60 ? 'text-gold' : 'text-matrix'
                      }`}>
                        {pp.severity}%
                      </span>
                    </div>
                    <div className="h-2 bg-void-light rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pp.severity}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                        className="h-full progress-glow rounded-full"
                        style={{
                          background: pp.severity >= 80 
                            ? '#FF3131' 
                            : pp.severity >= 60 
                              ? '#C9A227' 
                              : '#00FF41'
                        }}
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs text-gray-400 hover:text-gold flex items-center gap-1">
                        <Zap size={14} />
                        验证
                      </button>
                      <button className="text-xs text-gray-400 hover:text-gold flex items-center gap-1">
                        <ExternalLink size={14} />
                        解决方案
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 pt-4 border-t border-void-light">
                <button className="flex items-center gap-2 text-gray-400 hover:text-gold transition-colors">
                  <Download size={18} />
                  导出
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-gold transition-colors">
                  <RefreshCw size={18} />
                  重新分析
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* 示例展示 */}
        {!result && (
          <motion.section variants={itemVariants} className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-gold font-display">示例分析</h3>
            </div>
            <div className="bg-void-light/50 border border-void-light rounded-lg p-6">
              <div className="space-y-3 text-gray-400 text-sm">
                <p><span className="text-gold">输入:</span> 一个面向程序员的 AI 笔记应用</p>
                <p><span className="text-gold">目标:</span> 软件开发者</p>
                <div className="border-t border-void-light my-4" />
                <p><span className="text-matrix">输出:</span></p>
                <ul className="space-y-2 pl-4">
                  <li>• 笔记分散难以统一管理 (90%)</li>
                  <li>• 自然语言搜索困难 (85%)</li>
                  <li>• AI 生成内容不够准确 (80%)</li>
                  <li>• 跨设备同步太慢 (75%)</li>
                  <li>• 代码片段分享不方便 (70%)</li>
                </ul>
              </div>
            </div>
          </motion.section>
        )}

        {/* 页脚 */}
        <motion.footer variants={itemVariants} className="text-center mt-16 text-gray-500 text-sm">
          <p>© 2026 Pain Point Analyzer | Powered by AI</p>
        </motion.footer>
      </motion.div>
    </main>
  );
}
