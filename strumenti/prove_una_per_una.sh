#!/bin/bash
# lancia ogni prova della catena da sola e segna l'esito
cd /home/user/stateyour
out=$1; : > $out
for t in $(grep -o 'test/test_[a-z0-9_]*\.mjs' package.json | awk '!v[$0]++'); do
  s=$(date +%s); node $t > $out.$(basename $t .mjs).log 2>&1; e=$?
  echo "$e $(( $(date +%s)-s ))s $t" >> $out
done
echo FINE >> $out
