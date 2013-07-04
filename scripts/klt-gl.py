import pyglet
image = pyglet.image
gl = pyglet.gl
window = pyglet.window
graphics = pyglet.graphics

import numpy as np
import pylab
from pylab import imread
from shader import Shader
import ctypes
import os

#Note: with ipython use 
#%gui pyglet

try:
    __IPYTHON__
except:
    print "Run within IPython to get the event loop working automatically"
else:
    get_ipython().run_line_magic(u"gui", u"pyglet")

try:
    win.clear()
except:
    win = window.Window()

def getShaderFiles(vert, frag=None, shaderDir = "../shaders/"):
    if frag == None:
        # See if there is frag, vert with same name
        if os.path.exists(shaderDir + vert + ".vert") and os.path.exists(shaderDir + vert + ".frag"):
            vertFile = shaderDir + vert + ".vert"
            fragFile = shaderDir + vert + ".frag"
        else:
            # Else use generic draw2d vertex shader
            vertFile = shaderDir + "draw2d" + ".vert"
            fragFile = shaderDir + vert + ".frag"
    else:
        vertFile = shaderDir + vert + ".vert"
        fragFile = shaderDir + frag + ".frag"
    return vertFile, fragFile
        
            
    
    

def getNamedShader(vert, frag=None):
    vertFile, fragFile = getShaderFiles(vert, frag)

    vertString = open(vertFile).read()
    fragString = open(fragFile).read()

    return Shader([vertString], [fragString])

def loadImage(imfile):
    print imfile
    im = image.load(imfile)
    tex = im.get_texture()
    gl.glBindTexture(tex.target, tex.id)
    return tex

def rectangle(width, height):
    return (0.0,   0.0,
            width, 0.0,
            0.0,   height,
            0.0,   height,
            width, 0.0,
            width, height)


def white():
    gl.glClearColor(1,1,1,1)
    gl.glClear(gl.GL_COLOR_BUFFER_BIT)


def viewport():
    a = (ctypes.c_int * 4)()
    pa = ctypes.cast(a, ctypes.POINTER(ctypes.c_int))
    gl.glGetIntegerv(gl.GL_VIEWPORT, pa)
    return list(a)


def drawImage(imfile):
    s = getNamedShader("draw2d")
    im = image.load(imfile)
    height = im.height
    width = im.width
    tex = im.get_texture()
    gl.glBindTexture(tex.target, tex.id)

    s.bind()

    winh = win.get_size()[1]
    winw = win.get_size()[0]

    s.uniformf("uResolution", winw, winh)
    s.uniformf("uImageSize", im.width, im.height)

    positionLoc = gl.glGetAttribLocation(s.handle, "aPosition")
    texLoc = gl.glGetAttribLocation(s.handle, "aTextureCoord")

    vertCoords = rectangle(width, height) 
    texCoords = rectangle(1.0, 1.0)

    vlist = graphics.vertex_list(6,
         ("%ig2f" % positionLoc, vertCoords),
         ("%ig2f" % texLoc, texCoords)
    )

    vlist.draw(gl.GL_TRIANGLES)

class TestShader(object):
    def __init__(self, name1, name2=None, defaults=True):
        name = (name1, name2)
        self.shader = getNamedShader(*name)
        self.shader.bind()
        self.attributes = {}
        self.uniforms = {}
        self.nverts = 0
        self.vlist = None
        self.name = name

        if defaults:
            self["aPosition"] = rectangle(320, 240)
            self["aTextureCoord"] = rectangle(1.0, 1.0)
            self["uResolution"] = viewport()[2:]
            self["uImageSize"] = (320, 240)

    def __setitem__(self, key, val):
        self.shader.bind()
        attrLoc = gl.glGetAttribLocation(self.shader.handle, key)
        if attrLoc == -1:
            # Is a uniform
            self.uniforms[key] = val
            self.shader.uniformf(key, *val)
            self.draw()

        else:
            self.attributes[key] = ("%ig2f" % attrLoc, val)
            self.nverts = len(val) / 2
            self.updateAttributes()

    def refresh(self):
        newshader = getNamedShader(*self.name)
        if not newshader.handle:
            print "Loading Shader failed"
            return
        else:
            self.shader = newshader
            
        self.shader.bind()
        self.updateUniforms()
        self.updateAttributes()

    def autorefresh(self):
        from watchdog.events import FileSystemEventHandler, FileModifiedEvent
        from watchdog.observers import Observer

        self._needrefresh = 0

        def cb(dt):
            if self._needrefresh:
                white()
                self.refresh()
                self._needrefresh = 0

        pyglet.clock.schedule_interval(cb, 0.5)

        class Change(FileSystemEventHandler):
            def __init__(self, obj, *args, **kwargs):
                self.obj = obj
                super(Change, self).__init__(*args, **kwargs)

            def on_modified(self, e):
                if isinstance(e, FileModifiedEvent):
                    self.obj._needrefresh = 1

        obs = Observer()
        obs.schedule(Change(self), "../shaders", recursive=False)
        obs.start()

    def updateAttributes(self):
        self.vlist = graphics.vertex_list(self.nverts, *self.attributes.values())
        self.draw()

    def updateUniforms(self):
        for k, v in self.uniforms.items():
            self.shader.uniformf(k, *v)

    def draw(self):
        self.shader.bind()
        if self.vlist != None:
            self.vlist.draw(gl.GL_TRIANGLES)
        else:
            print "Vertices not set"
