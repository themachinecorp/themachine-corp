#!/usr/bin/env python3
"""Simple proxy server for AI Generator"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import http.client
import json

COMFY_HOST = "localhost"
COMFY_PORT = 8188

class ProxyHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/prompt":
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            # Forward to ComfyUI
            conn = http.client.HTTPConnection(COMFY_HOST, COMFY_PORT)
            conn.request("POST", "/prompt", body, {"Content-Type": "application/json"})
            response = conn.getresponse()
            
            self.send_response(response.status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(response.read())
            conn.close()
        else:
            self.send_error(404)
    
    def do_GET(self):
        if self.path.startswith("/view"):
            # Proxy image requests to ComfyUI
            conn = http.client.HTTPConnection(COMFY_HOST, COMFY_PORT)
            conn.request("GET", self.path)
            response = conn.getresponse()
            
            self.send_response(response.status)
            for header in ["Content-Type", "Content-Length"]:
                if header in response.getheaders():
                    self.send_header(header, response.getheader(header))
            self.end_headers()
            self.wfile.write(response.read())
            conn.close()
        elif self.path.startswith("/history"):
            # Proxy history requests
            conn = http.client.HTTPConnection(COMFY_HOST, COMFY_PORT)
            conn.request("GET", self.path)
            response = conn.getresponse()
            
            self.send_response(response.status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(response.read())
            conn.close()
        elif self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
        else:
            # Serve static files
            super().do_GET()

if __name__ == "__main__":
    print("Starting proxy server on port 8080...")
    server = HTTPServer(("0.0.0.0", 8080), ProxyHandler)
    server.serve_forever()
