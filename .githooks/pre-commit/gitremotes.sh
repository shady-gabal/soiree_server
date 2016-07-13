#!/bin/sh

git remote rm origin &> /dev/null
git remote rm development &> /dev/null
git remote rm production &> /dev/null
git remote add development https://git.heroku.com/soireeapp-development.git &> /dev/null
git remote add production https://git.heroku.com/soireeapp.git &> /dev/null
git remote add origin https://github.com/experience-soiree/soiree_server.git &> /dev/null