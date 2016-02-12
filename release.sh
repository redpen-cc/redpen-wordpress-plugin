#!/bin/bash
# This script uploads the latest state to WordPress Plugin Subversion Repository
# https://plugins.svn.wordpress.org/redpen/

if [ `git status --porcelain | wc -l` != 0 ]; then
    git status
    echo "Please commit all the changes to git first"    
    exit 1
fi

GIT_REV=`git rev-parse --short HEAD`

svn add *
svn commit -m "git: $GIT_REV"
