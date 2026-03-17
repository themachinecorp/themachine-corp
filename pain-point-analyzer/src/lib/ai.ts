// AI 分析模块
// 使用 OpenAI API 分析痛点

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface PainPoint {
  id: string;
  description: string;
  severity: number; // 0-100
  category?: string;
}

export interface AnalysisResult {
  productName: string;
  targetUsers: string;
  painPoints: PainPoint[];
  summary: string;
}

/**
 * 分析产品痛点
 */
export async function analyzePainPoints(
  productDescription: string,
  targetUsers: string
): Promise<AnalysisResult> {
  const prompt = `你是一个资深产品经理和用户研究员。请分析以下产品的用户痛点。

产品描述: ${productDescription}
目标用户: ${targetUsers}

请分析 5-8 个核心用户痛点，每个痛点包括:
1. 痛点描述
2. 严重程度 (0-100)
3. 痛点类别

请以 JSON 格式返回:
{
  "painPoints": [
    {"description": "痛点描述", "severity": 数字, "category": "类别"}
  ],
  "summary": "总结"
}

只返回 JSON，不要其他内容。`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: '你是一个资深产品分析师，擅长分析用户痛点。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 解析 JSON
    const result = JSON.parse(content);
    
    // 添加 ID
    const painPoints = result.painPoints.map((pp: any, index: number) => ({
      id: `pp-${Date.now()}-${index}`,
      ...pp
    }));

    return {
      productName: productDescription,
      targetUsers,
      painPoints,
      summary: result.summary
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

/**
 * 验证痛点 (查询网上是否有人提过)
 */
export async function validatePainPoint(painPointDescription: string): Promise<{
  hasDiscussion: boolean;
  discussionCount: number;
  hasSolution: boolean;
  summary: string;
}> {
  // TODO: 实现验证逻辑
  // 暂时返回模拟数据
  return {
    hasDiscussion: Math.random() > 0.3,
    discussionCount: Math.floor(Math.random() * 500),
    hasSolution: Math.random() > 0.5,
    summary: '基于网上讨论分析，该痛点确实存在且有一定关注度。'
  };
}

/**
 * 推荐解决方案
 */
export async function recommendSolutions(painPointDescription: string): Promise<Array<{
  name: string;
  description: string;
  matchScore: number;
  url: string;
}>> {
  // TODO: 实现推荐逻辑
  // 暂时返回模拟数据
  return [
    {
      name: 'LangChain',
      description: '开发 LLM 应用的框架',
      matchScore: 85,
      url: 'https://github.com/hwchase17/langchain'
    },
    {
      name: 'LlamaIndex',
      description: '更好的 LLM 数据框架',
      matchScore: 78,
      url: 'https://github.com/jerryjliu/llama_index'
    }
  ];
}
