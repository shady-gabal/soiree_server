#!/bin/sh

git remote rm origin &> ../log
git remote rm development &> ../log
git remote rm production &> ../log
git remote rm prod_origin &> ../log
git remote add development https://git.heroku.com/soireeapp-development.git &> ../log
git remote add production https://git.heroku.com/soireeapp.git &> ../log
git remote add origin https://github.com/experience-soiree/soiree_server_dev.git &> ../log
git remote add prod_origin https://github.com/experience-soiree/soiree_server.git &> ../log