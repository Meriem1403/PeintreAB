#!/bin/bash
# Alias — lance le vrai script de déploiement NAS.
exec bash "$(cd "$(dirname "$0")/.." && pwd)/update-deploy.sh"
