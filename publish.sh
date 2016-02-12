#!/bin/bash -e
# This script publishes the latest state to WordPress Plugin Subversion Repository

SVN_REPO=https://plugins.svn.wordpress.org/redpen/trunk/

cd `dirname $0`

if [ `git status --porcelain | wc -l` != 0 ]; then
  git status
  echo "Please commit all the changes to git first"
  exit 1
fi

if [ ! -d .svn ]; then
  echo "Registering current directory also as Subversion working tree"
  svn checkout $SVN_REPO svn
  mv svn/.svn .
  rm -fr svn
fi

GIT_REV=`git rev-parse --short HEAD`
UNTRACKED_IN_SVN=`svn status | grep '^\?' | sed 's/^\?       //'`

[ ! -z "$UNTRACKED_IN_SVN" ] && svn add "$UNTRACKED_IN_SVN"

svn commit -m "git: $GIT_REV"

echo "Changes synced to $SVN_REPO"
