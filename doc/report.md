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

Cascade
-------

The core of the face detection method used is the cascade structure described
in [TODO], which subjects each window to progressively harder tests, each test
being a stage in the cascade which specifies a number of weak classifiers with
corresponding Local Binary Pattern features within the window.

Although the precise nature of these weak classifiers is crucial when
constructing a cascade from training images (using the statistical method
of Boosting to construct a strong classifier from individual classifiers
performing only slightly better than chance) for the purposes of detection
they can be thought of rather more abstractly.


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