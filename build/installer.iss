[Setup]
AppId=com.etibol.pos
AppName=ETİBOL POS
AppVersion=2.0.0
AppPublisher=ETİBOL POS
AppCopyright=Copyright (C) 2024 ETİBOL POS
DefaultDirName={autopf}\ETIBOL POS
DefaultGroupName=ETİBOL POS
DisableProgramGroupPage=yes
OutputBaseFilename=ETIBOL_POS_Setup_2.0.0
OutputDir=..\dist
Compression=lzma2/ultra64
SolidCompression=yes
SetupIconFile=..\resources\icon.ico
UninstallDisplayIcon={app}\ETİBOL POS.exe
ArchitecturesInstallIn64BitMode=x64
MinVersion=6.1.7601
WizardStyle=modern

; Koyu tema için özel eklenti kullanımı gerekirse buraya eklenebilir. Şimdilik Windows'un kendi modern tasarımını kullanıyoruz.

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
Source: "..\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\ETİBOL POS"; Filename: "{app}\ETİBOL POS.exe"
Name: "{autodesktop}\ETİBOL POS"; Filename: "{app}\ETİBOL POS.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\ETİBOL POS.exe"; Description: "{cm:LaunchProgram,ETİBOL POS}"; Flags: nowait postinstall skipifsilent
