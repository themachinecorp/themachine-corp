# X (Twitter) Automation

使用agent-browser控制X (Twitter)。

## 前置条件
1. 使用Chrome登录X一次
2. 使用--profile保持登录状态

## 命令

### 打开X
```bash
agent-browser open https://x.com
```

### 发帖
```bash
# 点击发推按钮
agent-browser click "[data-testid='tweetButton']"

# 输入内容
agent-browser type "[data-testid='tweetTextarea']" "Hello World!"

# 点击发送
agent-browser click "[data-testid='tweetButtonInline']"
```

### 获取时间线
```bash
agent-browser snapshot
agent-browser screenshot
```

### 搜索
```bash
# 点击搜索框
agent-browser click "[data-testid='searchBox']"

# 输入搜索词
agent-browser type "[data-testid='searchInput']" "#AI"

# 按回车
agent-browser press Enter
```

## Workflow示例

### 发推流程
1. `agent-browser open https://x.com`
2. `agent-browser wait "[data-testid='tweetButton']"` 
3. `agent-browser click "[data-testid='tweetButton']"`
4. `agent-browser type "[data-testid='tweetTextarea']" "内容"`
5. `agent-browser click "[data-testid='tweetButtonInline']"`

### 注意事项
- 使用--headless=false可以看到浏览器操作
- 首次需要手动登录
- 发帖间隔建议30秒以上避免被封
