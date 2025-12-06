Get-ChildItem *.ase,*.aseprite | ForEach-Object {
    aseprite -b $_.FullName --save-as "../public/emojis/$($_.BaseName).png"
}
