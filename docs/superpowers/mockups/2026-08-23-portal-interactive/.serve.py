# python3 -m http.server sends no cache headers, so Chrome served a stale fixtures.js while
# disk had the new one — several verification runs measured old assets and looked like bugs.
import http.server, socketserver
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('127.0.0.1', 8899), H) as s:
    s.serve_forever()
