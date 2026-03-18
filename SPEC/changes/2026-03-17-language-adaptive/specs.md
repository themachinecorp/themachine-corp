# Specs: Language Adaptive Response

## Function
```javascript
function isChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}
```

## Implementation
- 在每个API调用前检测输入语言
- 根据语言添加对应的前缀指令：
  - 中文：请用中文回复
  - 英文：Please respond in English
