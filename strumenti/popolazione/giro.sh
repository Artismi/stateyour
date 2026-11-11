#!/bin/bash
# giro.sh <nome> <file> <testo da> <testo a con SEME> <semi...>
P=/tmp/claude-0/-home-user/e4f7d681-8c14-51b2-bfef-3d2a580b715c/scratchpad/pop; cd /home/user/stateyour
nome=$1; file=$2; da=$3; a=$4; shift 4
for s in "$@"; do node $P/morbido.mjs $file "$da" "${a//SEME/$s}" $P/${nome}_$s.json; done
printf '%s\n' "$@" | xargs -P 3 -I{} sh -c "node $P/${nome}_{}.mjs > $P/${nome}_{}.log 2>&1"
echo FATTO
