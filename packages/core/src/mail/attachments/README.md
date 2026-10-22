# Mail attachments

Pure functions for the attachment policy (ADR 0009 Topic 5): the 20 MiB outbound
total check, the inbound store decision, the antivirus scanner port with an off
and a fake adapter, and the download gate. No persistence, network or UI; import
the files directly (no package-level export).
