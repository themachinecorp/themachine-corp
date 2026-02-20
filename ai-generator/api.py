#!/usr/bin/env python3
"""
简化的 AI 图像生成后端
直接调用 Stable Diffusion，无需复杂工作流
"""

import os
import sys
import json
import time
import base64
import uuid
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import http.client
import threading
import asyncio

# 设置路径
COMFY_DIR = os.path.expanduser("~/video-ai/ComfyUI")
sys.path.insert(0, COMFY_DIR)

# 全局变量
comfy_client = None
comfy_port = 8188
output_dir = os.path.join(COMFY_DIR, "output")
history = {}

def get_comfy_client():
    """获取 ComfyUI API 客户端"""
    global comfy_client
    if comfy_client is None:
        from comfy_api import ComfyUIClient
        comfy_client = ComfyUIClient("127.0.0.1", comfy_port)
    return comfy_client

class APIHandler(SimpleHTTPRequestHandler):
    """处理 API 请求"""
    
    def log_message(self, format, *args):
        pass  # 静默日志
    
    def do_GET(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
            
        elif parsed.path == "/history":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(history).encode())
            
        elif parsed.path.startswith("/view/"):
            # 服务生成的图片
            filename = parsed.path.split("/")[-1]
            filepath = os.path.join(output_dir, filename)
            if os.path.exists(filepath):
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.end_headers()
                with open(filepath, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404)
        else:
            # 静态文件（HTML）
            if self.path == "/" or self.path == "":
                self.path = "/index.html"
            return SimpleHTTPRequestHandler.do_GET(self)
    
    def do_POST(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/generate":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            
            try:
                data = json.loads(body)
            except:
                self.send_error(400, "Invalid JSON")
                return
            
            prompt = data.get("prompt", "").strip()
            if not prompt:
                self.send_error(400, "No prompt")
                return
            
            width = data.get("width", 1024)
            height = data.get("height", 1024)
            model = data.get("model", "sdxl_base_1.0.safetensors")
            steps = data.get("steps", 30)
            cfg = data.get("cfg", 6)
            negative_prompt = data.get("negative_prompt", "low quality, blurry, ugly, deformed, bad anatomy, worst quality, low resolution, bad hands, missing fingers, watermark, signature")
            sampler = data.get("sampler", "dpmpp_2m_karras")
            
            # 生成任务 ID
            task_id = str(uuid.uuid4())[:8]
            
            # 创建任务
            task = {
                "id": task_id,
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "sampler": sampler,
                "model": model,
                "width": width,
                "height": height,
                "progress": 0,
                "status": "queued",
                "created_at": time.time()
            }
            history[task_id] = task
            
            # 异步执行
            threading.Thread(target=execute_generation, args=(task_id,)).start()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"task_id": task_id, "status": "queued"}).encode())
            
        elif parsed.path == "/status":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            task_id = data.get("task_id")
            
            task = history.get(task_id)
            if task:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(task).encode())
            else:
                self.send_error(404, "Task not found")
        else:
            self.send_error(404)
    
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        SimpleHTTPRequestHandler.end_headers(self)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()


def execute_generation(task_id):
    """执行图像生成"""
    task = history.get(task_id)
    if not task:
        return
    
    try:
        task["status"] = "running"
        
        # 连接到 ComfyUI API
        conn = http.client.HTTPConnection("127.0.0.1", comfy_port)
        
        # 构建工作流（优化版）
        seed = int(time.time() * 1000) % 1000000000
        
        # 获取参数
        prompt = task.get("prompt", "")
        negative_prompt = task.get("negative_prompt", "low quality, blurry, ugly, deformed, bad anatomy, worst quality, low resolution")
        sampler = task.get("sampler", "dpmpp_2m_karras")
        steps = task.get("steps", 30)
        cfg = task.get("cfg", 7)
        width = task.get("width", 768)
        height = task.get("height", 1024)
        model = task.get("model", "majicmixRealistic_v7.safetensors")
        
        workflow = {
            "prompt": {
                "3": {
                    "inputs": {"text": prompt, "clip": ["4", 1]},
                    "class_type": "CLIPTextEncode"
                },
                "3n": {
                    "inputs": {"text": negative_prompt, "clip": ["4", 1]},
                    "class_type": "CLIPTextEncode"
                },
                "4": {
                    "inputs": {"ckpt_name": model},
                    "class_type": "CheckpointLoaderSimple"
                },
                "5": {
                    "inputs": {
                        "seed": seed,
                        "steps": steps,
                        "cfg": cfg,
                        "sampler_name": sampler,
                        "scheduler": "karras",
                        "positive": ["3", 0],
                        "negative": ["3n", 0],
                        "model": ["4", 0],
                        "latent_image": ["8", 0],
                        "denoise": 1
                    },
                    "class_type": "KSampler"
                },
                "8": {
                    "inputs": {
                        "width": width,
                        "height": height,
                        "batch_size": 1
                    },
                    "class_type": "EmptyLatentImage"
                },
                "10": {
                    "inputs": {"samples": ["5", 0], "vae": ["4", 2]},
                    "class_type": "VAEDecode"
                },
                "11": {
                    "inputs": {"images": ["10", 0], "filename_prefix": "ai-generator"},
                    "class_type": "SaveImage"
                }
            }
        }
        
        # 提交任务
        headers = {"Content-Type": "application/json"}
        conn.request("POST", "/prompt", json.dumps(workflow), headers)
        response = conn.getresponse()
        result = json.loads(response.read())
        
        if "prompt_id" in result:
            prompt_id = result["prompt_id"]
            task["prompt_id"] = prompt_id
            
            # 轮询进度
            while True:
                conn.request("GET", f"/history/{prompt_id}")
                resp = json.loads(conn.getresponse().read())
                
                if prompt_id in resp:
                    prompt_data = resp[prompt_id]
                    status = prompt_data.get("status", {})
                    
                    if status.get("status_str") == "success":
                        # 获取输出图片
                        outputs = prompt_data.get("outputs", {})
                        for node_id, node_data in outputs.items():
                            if "images" in node_data:
                                img = node_data["images"][0]
                                task["filename"] = img["filename"]
                                task["image_url"] = f"/view/{img['filename']}"
                                task["progress"] = 100
                                task["status"] = "completed"
                                break
                        break
                    elif status.get("status_str") == "error":
                        task["status"] = "error"
                        task["error"] = status.get("error_message", "Unknown error")
                        break
                    
                    # 更新进度
                    exec_info = status.get("exec_info", {})
                    if "progress" in exec_info:
                        task["progress"] = int(exec_info["progress"] * 100)
                
                time.sleep(2)
        
        conn.close()
        
    except Exception as e:
        task["status"] = "error"
        task["error"] = str(e)


# 确保输出目录存在
os.makedirs(output_dir, exist_ok=True)

# 启动服务器
PORT = 8080
server = HTTPServer(("0.0.0.0", PORT), APIHandler)
print(f"AI Generator API running on http://0.0.0.0:{PORT}")
server.serve_forever()
