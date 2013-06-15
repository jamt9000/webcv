Background
==========

Face Detection
--------------

OpenGL for Computation
----------------------

Vision in the Browser
---------------------

Implementation
==============

Integral?
---------

Cascade
-------

The core of the face detection method used is the cascade structure described
in [TODO], which subjects each window to progressively harder tests, each test
being a stage in the cascade which specifies a number of weak classifiers with
corresponding Local Binary Pattern features within the window.

Although the precise nature of these weak classifiers is crucial when
constructing a cascade from training images (using the statistical method of
Boosting to construct a strong classifier from individual classifiers
performing only slightly better than chance) for the purposes of detection we
need not be overly concerned with this. From a more abstract point of view,
the weak classifiers simply tell us which points we need to look up in the
integral image and which values should be used in the subsequent arithmetic in
order to determine whether a window passes a stage. The main challenge then is
to do this as fast as possible.

We initially implement the cascade using only JavaScript, running on the CPU,
to give us a reference implementation which can then be used to assess the
correctness of a WebGL version running on the GPU. For the moment we only
consider the base scale of the cascade, $24\times24$ pixels, meaning we can only
detect faces which occupy a window of these dimensions. We use the XML cascade file
`lbpcascade_frontalface.xml` from the @OpenCV project, however we first use a
Python script to convert this to a format more suitable for use with
JavaScript, JSON (JavaScript Object Notation) which allows us to treat the
cascade as a native JavaScript data structure, made up of JavaScript objects (associative maps with string keys, of the form `{"key": value}`)
and arrays (eg. `[v1,v2,v3]` where values can be any type, not necessarily homogenous). An example of this data structure is given below, showing just one stage with one of its weak classifiers

\pagebreak

~~~~ {.javascript}

var lbpcascade_frontalface = {
    "width": 24, 
    "height": 24, 
    "stages": [
        // 1st Stage
        {
            "stageThreshold": -0.7520892024040222,
            "weakClassifiers": [
                // 1st Weak classifier
                {
                    "featureRectangle": [6, 5, 4, 3],
                    "leafValues": [-0.654321014881134, 0.8888888955116272], 
                    "categoryBitVector": [
                        -67130709, 
                        -21569, 
                        -1426120013, 
                        -1275125205, 
                        -21585, 
                        -16385, 
                        587145899, 
                        -24005
                    ]
                }
                // ...2 more weak classifiers in this stage
            ]
        },
    // ...19 more stages (having up to 10 weak classifiers each)
    ]
}

~~~~

Essentially, we have an array of stages, where each stage has a
`stageThreshold` and its own array of `weakClassifiers`. The elements of each
weak classifier merit further explanation:

* `featureRectangle`: Gives the position and dimensions of the weak
classifier's Local Binary Pattern feature as a tuple $(x,y,width,height)$. The
$(x,y)$ coordinates give the top left corner of the feature, and the width and
height are those of a single block of the feature, as shown in Figure
\ref{featureRectangleDia}.

~~~~ {.ditaa .no-separation .no-shadows .scale:0.8 "Interpretation of `featureRectangle` values \label{featureRectangleDia}"}
Window
*-----------------------------+
|(0,0)    width               |
|         <--->               |
|        *-----+-----+-----+  | 
|      ^ |(x,y)|     |     |  | 
|height| |     |     |     |  | 
|      v |     |     |     |  | 
|        +-----+-----+-----+  | 
|        |     |     |     |  | 
|        |     |     |     |  | 
|        |     |     |     |  | 
|        +-----+-----+-----+  | 
|        |     |     |     |  | 
|        |     |     |     |  | 
|        |     |     |     |  | 
|        +-----+-----+-----+  | 
|        Local Binary Pattern |
|                             |
|                             |
+-----------------------------+      

~~~~


* `leafValues`: The contribution of the weak classifier to the stage total in
the case that it evaluates as negative (first value) or positive (second
value). The stage total is the sum of these results for all its weak
classifiers, and a stage passes if this total exceeds `stageThreshold`.

* `categoryBitVector`: Perhaps the most cryptic of the elements, this is a
compact representation of which of the 256 possible Local Binary Patterns
should be considered a positive result for the weak classifier, and which
should be negative. It should be interpreted as eight 32-bit signed integers,
giving 256 bits overall. This gives us a bit vector, where the $i^{th}$ bit
(counting from 0) is 1 if pattern $i$ is negative and 0 if it is positive
(using OpenCV's somewhat counterintuitive convention). For example, pattern
$10101010_{bin}$ (which would represent alternating lighter and darker blocks
than the centre) is 170 in decimal, and if this pattern were indicative of a
face, then the $170^{th}$ bit in the bit vector would be 0. To check if bit
$i$ is zero or one, we can use the bitwise formula:
\newline `bitvec[i >> 5] & (1 << (i & 31))`
\newline
which will be non-zero if bit $i$ is set. This uses a right
shift by 5 to select the three highest bits of $i$ as an index to one of the 8
integers, then ANDs this integer with a number whose $j^{th}$ bit (only) is 1,
hence being non-zero if bit $j$ of the integer is set. $j$ is the lowest 5
bits of $i$ and is obtained by masking $i$ with 31 ($11111_{bin}$), and then
to get a number whose $j^{th}$ bit is 1 we left shift 1 by $j$.

This representation of the weak classifiers is in fact a simplification over
that used in the original OpenCV XML file, which uses a rather vaguely named
`<internalNodes>` element containing, in order, two dummy pointers to child
nodes (unused, since we are dealing with a stump based classifier, containing
only two leaf nodes, rather than a tree), the index of the feature rectangle
(46 in example below) which is used to look up the actual rectangle specified
elsewhere in the XML file, and then the 8 elements of the bit vector.

~~~~ {.xml}
    <weakClassifiers>
      <!-- tree 0 -->
      <_>
        <internalNodes>
          0 -1 46 -67130709 -21569 -1426120013 -1275125205 -21585
          -16385 587145899 -24005</internalNodes>
        <leafValues>
          -0.6543210148811340 0.8888888955116272</leafValues></_>
      ...
~~~~





Scaling
--------

Optimising
----------

Evaluation
-----------


Application for Head Tracking
=============================

Grouping Rectangles
-------------------

Tracking
--------

Kalman Filter
-------------


Further Work
=============