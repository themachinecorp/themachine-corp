/**
 * AI Content Generator
 * Generates high-quality technical articles using AI APIs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  outputDir: path.join(__dirname, '..', 'website', 'source', '_posts'),
  apiEndpoint: process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
  apiKey: process.env.AI_API_KEY,
  model: process.env.AI_MODEL || 'gpt-4',
  language: process.env.CONTENT_LANGUAGE || 'English'
};

// Article templates for different categories
const TEMPLATES = {
  tutorial: {
    prefix: "Create a comprehensive technical tutorial about",
    sections: ['Introduction', 'Prerequisites', 'Step-by-Step Guide', 'Code Examples', 'Best Practices', 'Conclusion'],
    style: 'detailed, educational, practical'
  },
  guide: {
    prefix: "Write a practical guide on",
    sections: ['Overview', 'Getting Started', 'Implementation', 'Tips and Tricks', 'Common Issues', 'Summary'],
    style: 'concise, actionable, clear'
  },
  review: {
    prefix: "Write an in-depth review/analysis of",
    sections: ['Introduction', 'Features', 'Pros and Cons', 'Use Cases', 'Pricing', 'Final Verdict'],
    style: ['balanced', 'informative', 'honest']
  },
  news: {
    prefix: "Write a news article about the latest development in",
    sections: ['Headlines', 'What Happened', 'Why It Matters', 'Expert Reactions', 'Future Implications', 'Sources'],
    style: 'timely, factual, engaging'
  }
};

// Topics database - AI and Tech
const TOPICS = {
  python: [
    'Python decorators explained',
    'Async/await in Python 3.10+',
    'Python type hints and mypy',
    'FastAPI best practices',
    'Python testing with pytest',
    'Pandas data manipulation'
  ],
  ai_ml: [
    'Introduction to transformer models',
    'Fine-tuning LLaMA models',
    'Building RAG applications',
    'Prompt engineering techniques',
    'Computer vision with YOLO',
    'Stable Diffusion prompting guide'
  ],
  webdev: [
    'Next.js 14 features',
    'React Server Components',
    'TypeScript patterns',
    'CSS Grid and Flexbox',
    'Web performance optimization',
    'API design best practices'
  ],
  devops: [
    'Docker best practices',
    'Kubernetes for beginners',
    'CI/CD with GitHub Actions',
    'Infrastructure as Code',
    'Monitoring with Prometheus',
    'Cloud security essentials'
  ]
};

/**
 * Generate article using AI API
 */
async function generateArticle(topic, category = 'tutorial') {
  const template = TEMPLATES[category];
  
  const systemPrompt = `You are an expert technical writer specializing in AI and programming tutorials. 
Your writing style is: ${template.style}
Write in ${CONFIG.language}.
Include code examples where appropriate.
Format headings with ##.
Use bullet points for lists.
Keep paragraphs concise and readable.`;

  const userPrompt = `${template.prefix} ${topic}.
  
Structure your response as a Markdown article with:
${template.sections.map(s => `- ## ${s}`).join('\n')}

Title: ${topic}
Date: ${new Date().toISOString().split('T')[0]}
description: A comprehensive guide to ${topic}

Write the complete article now.`;

  const requestData = JSON.stringify({
    model: CONFIG.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.apiEndpoint);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.choices && response.choices[0]) {
            resolve(response.choices[0].message.content);
          } else {
            reject(new Error('Invalid API response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(requestData);
    req.end();
  });
}

/**
 * Save article to file
 */
function saveArticle(content, topic, category) {
  // Generate filename from topic
  const filename = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '.md';
  
  const filePath = path.join(CONFIG.outputDir, filename);
  
  // Add front matter
  const date = new Date().toISOString().split('T')[0];
  const frontMatter = `---
title: "${topic}"
date: ${date}
categories: [${category}]
tags: [ai, tech, ${category}]
description: "${topic} - A comprehensive guide"
---

`;
  
  const fullContent = frontMatter + content;
  fs.writeFileSync(filePath, fullContent, 'utf8');
  
  console.log(`✅ Article saved: ${filename}`);
  return filePath;
}

/**
 * Generate multiple articles
 */
async function generateBatch(topics, category = 'tutorial') {
  console.log(`\n🚀 Starting batch generation: ${topics.length} articles\n`);
  
  const results = [];
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    console.log(`📝 Generating [${i + 1}/${topics.length}]: ${topic}`);
    
    try {
      const content = await generateArticle(topic, category);
      const filePath = saveArticle(content, topic, category);
      results.push({ topic, success: true, file: filePath });
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to generate: ${topic}`, error.message);
      results.push({ topic, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('🤖 AI Content Generator');
  console.log('======================\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${CONFIG.outputDir}`);
  }
  
  // Select topics to generate
  const topics = [
    ...TOPICS.python.slice(0, 2),
    ...TOPICS.ai_ml.slice(0, 3),
    ...TOPICS.webdev.slice(0, 2),
    ...TOPICS.devops.slice(0, 2)
  ];
  
  // Generate all articles
  const results = await generateBatch(topics, 'tutorial');
  
  // Summary
  console.log('\n📊 Generation Summary');
  console.log('=====================');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\nFailed topics:');
    results.filter(r => !r.success).forEach(r => console.log(`  - ${r.topic}`));
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateArticle, generateBatch, saveArticle };
