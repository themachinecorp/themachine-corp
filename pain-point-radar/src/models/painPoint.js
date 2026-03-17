/**
 * 痛点数据模型
 */
export const PainPointStatus = {
  DISCOVERED: 'discovered',
  VALIDATED: 'validated',
  SHIPPED: 'shipped'
};

export const SourceType = {
  HN: 'hn',
  GITHUB: 'github',
  HF: 'hf',
  REDDIT: 'reddit',
  RSS: 'rss'
};

/**
 * 创建痛点对象
 */
export function createPainPoint({
  conclusion,
  evidenceUrl,
  source,
  nextAction = ''
}) {
  return {
    id: crypto.randomUUID(),
    conclusion,
    evidence_url: evidenceUrl,
    source,
    next_action: nextAction,
    status: PainPointStatus.DISCOVERED,
    created_at: new Date().toISOString().split('T')[0]
  };
}
