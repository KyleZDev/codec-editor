
!macro customInstall
  WriteRegStr HKCU "Software\Classes\*\shell\Codec" "" "Open with Codec"
  WriteRegStr HKCU "Software\Classes\*\shell\Codec" "Icon" "$INSTDIR\Codec.exe"
  WriteRegStr HKCU "Software\Classes\*\shell\Codec\command" "" '"$INSTDIR\Codec.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\Directory\shell\Codec" "" "Open with Codec"
  WriteRegStr HKCU "Software\Classes\Directory\shell\Codec" "Icon" "$INSTDIR\Codec.exe"
  WriteRegStr HKCU "Software\Classes\Directory\shell\Codec\command" "" '"$INSTDIR\Codec.exe" "%V"'
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\Codec" "" "Open with Codec"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\Codec" "Icon" "$INSTDIR\Codec.exe"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\Codec\command" "" '"$INSTDIR\Codec.exe" "%V"'
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\*\shell\Codec"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\Codec"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\Codec"
!macroend
