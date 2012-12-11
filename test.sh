#!/usr/bin/env bash

gnome-terminal -yeti --server --port=9000
sleep 2
yeti ./tests/*.html &
sleep 2

xdg-open "http://localhost:9000" &


