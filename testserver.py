#!/usr/bin/env python


import webbrowser
import SimpleHTTPServer
import SocketServer

PORT = 8000

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
webbrowser.open("http://localhost:%d/demos" % PORT)
httpd.serve_forever()


