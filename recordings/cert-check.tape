# cert-check all — TLS certificate monitoring
Output recordings/cert-check.gif

Set Shell "bash"
Set FontSize 15
Set FontFamily "JetBrains Mono"
Set Width 880
Set Height 600
Set Padding 16
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms

# Setup: set prompt, add cert-check to PATH, then clear screen
Hide
Type "export PS1='root@openfang:~# ' PATH=/tmp:$PATH"
Enter
Sleep 500ms
Type "clear"
Enter
Sleep 500ms
Show

# Now type the command visibly
Type "cert-check all --warn 14"
Sleep 300ms
Enter

# Wait for output (22 services, ~15s)
Sleep 20s

# Hold on result
Sleep 4s
