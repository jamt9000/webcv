import os

basefile = "webcv.js"
outfile = "webcv-all.js"

files = [basefile]

for f in os.listdir('.'):
    if f.startswith("webcv-") and f.endswith(".js"):
        if not f.startswith("webcv-all"):
            files.append(f)

# To get relative js path
# http://stackoverflow.com/a/4440632
webcv_all = """
            var jsFileLocation = $('script[src*="%s"]').attr('src');
            console.log(jsFileLocation);
            jsFileLocation = jsFileLocation.replace('%s', '');
            console.log(jsFileLocation);
            """ % (outfile, outfile)

includejs = """$("head").append('<script type="text/javascript" src="' + jsFileLocation + "%s" + '"></script>');\n"""

for f in files:
    #webcv_all += open(f).read() + "\n"
    webcv_all += includejs % f


outfile = open(outfile, "wb")

outfile.write(webcv_all)
