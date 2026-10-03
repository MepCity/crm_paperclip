#!/bin/sh
# Shared helper: prints the extended regex of terms that must never enter the repository.
# Terms are assembled from octal escapes so this file never contains them literally.
printf '%s|%s' "$(printf '\172\157\150\157')" "$(printf '\071\062\071\063\064\066\067\067\067')"
