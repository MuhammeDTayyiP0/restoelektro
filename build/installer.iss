; =====================================================
; ETIBOL POS - Modern Dark Theme Installer
; Inno Setup Script with Full Custom UI
; =====================================================

[Setup]
AppId=com.etibol.pos
AppName=ETIBOL POS
AppVersion=2.0.1
AppVerName=ETIBOL POS 2.0.1
AppPublisher=ETIBOL POS
AppCopyright=Copyright (C) 2024 ETIBOL POS
DefaultDirName={autopf}\ETIBOL POS
DefaultGroupName=ETIBOL POS
DisableProgramGroupPage=yes
OutputBaseFilename=ETIBOL_POS_Setup_2.0.1
OutputDir=..\dist
Compression=lzma2/ultra64
SolidCompression=yes
SetupIconFile=..\resources\icon.ico
UninstallDisplayIcon={app}\ETIBOL POS.exe
ArchitecturesInstallIn64BitMode=x64
MinVersion=6.1.7601
WizardStyle=modern
WizardSizePercent=120,120
WizardResizable=no
WindowVisible=no

; Wizard images
WizardImageFile=..\resources\installer_sidebar.jpg
WizardSmallImageFile=..\resources\icon.ico

; Uninstall
UninstallDisplayName=ETIBOL POS

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Tasks]
Name: "desktopicon"; Description: "Masaustu kisayolu olustur"; Flags: checkedonce
Name: "startmenuicon"; Description: "Baslat menusune ekle"; Flags: checkedonce

[Files]
Source: "..\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\ETIBOL POS"; Filename: "{app}\ETIBOL POS.exe"; Tasks: startmenuicon
Name: "{autodesktop}\ETIBOL POS"; Filename: "{app}\ETIBOL POS.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\ETIBOL POS.exe"; Description: "ETIBOL POS uygulamasini baslat"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
const
  // Ana Koyu Tema Renkleri (BGR formatinda - Inno Setup icin ters cevrilmis)
  DARK_BG       = $2A170F;    // #0F172A - Ana arka plan (midnight blue)
  DARK_SURFACE  = $3B291E;    // #1E293B - Yuzey rengi
  DARK_PANEL    = $554433;    // #334455 - Panel arka plan
  ACCENT_COLOR  = $E5464F;    // #4F46E5 - Vurgu rengi (indigo)
  ACCENT_LIGHT  = $F88C81;    // #818CF8 - Acik vurgu
  TEXT_WHITE    = $FFFFFF;    // #FFFFFF - Beyaz yazi
  TEXT_LIGHT    = $B8A394;    // #94A3B8 - Acik gri yazi
  TEXT_MUTED    = $8B7464;    // #64748B - Soluk yazi
  BORDER_COLOR  = $554433;    // #334455 - Kenarlık rengi
  BTN_BG        = $E5464F;    // #4F46E5 - Buton arka plan
  BTN_TEXT      = $FFFFFF;    // Buton yazi rengi
  PROGRESS_BG   = $3B291E;    // Progress bar arka plan
  PROGRESS_FG   = $E5464F;    // Progress bar on plan

procedure ColorPanel(Panel: TPanel);
begin
  Panel.Color := DARK_BG;
  Panel.ParentBackground := False;
end;

procedure StyleLabel(Lbl: TNewStaticText; FontColor: TColor; FontSize: Integer; IsBold: Boolean);
begin
  Lbl.Font.Color := FontColor;
  Lbl.Font.Size := FontSize;
  Lbl.Font.Name := 'Segoe UI';
  if IsBold then
    Lbl.Font.Style := [fsBold]
  else
    Lbl.Font.Style := [];
end;

procedure InitializeWizard();
var
  TitleLabel: TNewStaticText;
  DescLabel: TNewStaticText;
  VersionLabel: TNewStaticText;
  Separator: TBevel;
begin
  // ==============================================
  // ANA FORM STILLENDIRME
  // ==============================================
  
  // Wizard form arka plan rengi
  WizardForm.Color := DARK_BG;
  
  // Tum Panel Arka Planlari - Koyu Tema
  // (Notebook bilesenleri Color destegi sunmadigi icin kaldirildi)
  
  // MainPanel (ust baslik cubugu alani)
  WizardForm.MainPanel.Color := DARK_SURFACE;
  WizardForm.MainPanel.ParentBackground := False;
  
  // ==============================================
  // BASLIK VE ACIKLAMA YAZILARI
  // ==============================================
  
  // Sayfa basligi (ust kisim)
  WizardForm.PageNameLabel.Font.Color := TEXT_WHITE;
  WizardForm.PageNameLabel.Font.Name := 'Segoe UI';
  WizardForm.PageNameLabel.Font.Size := 12;
  WizardForm.PageNameLabel.Font.Style := [fsBold];
  
  // Sayfa aciklamasi
  WizardForm.PageDescriptionLabel.Font.Color := TEXT_LIGHT;
  WizardForm.PageDescriptionLabel.Font.Name := 'Segoe UI';
  WizardForm.PageDescriptionLabel.Font.Size := 9;
  
  // ==============================================
  // HOSGELDIN SAYFASI STILLENDIRME
  // ==============================================
  
  // Hosgeldin basligi
  WizardForm.WelcomeLabel1.Font.Color := TEXT_WHITE;
  WizardForm.WelcomeLabel1.Font.Name := 'Segoe UI';
  WizardForm.WelcomeLabel1.Font.Size := 16;
  WizardForm.WelcomeLabel1.Font.Style := [fsBold];
  
  // Hosgeldin aciklamasi
  WizardForm.WelcomeLabel2.Font.Color := TEXT_LIGHT;
  WizardForm.WelcomeLabel2.Font.Name := 'Segoe UI';
  WizardForm.WelcomeLabel2.Font.Size := 10;
  
  // ==============================================
  // BITIRME SAYFASI STILLENDIRME
  // ==============================================
  
  WizardForm.FinishedLabel.Font.Color := TEXT_LIGHT;
  WizardForm.FinishedLabel.Font.Name := 'Segoe UI';
  WizardForm.FinishedLabel.Font.Size := 10;
  
  WizardForm.FinishedHeadingLabel.Font.Color := TEXT_WHITE;
  WizardForm.FinishedHeadingLabel.Font.Name := 'Segoe UI';
  WizardForm.FinishedHeadingLabel.Font.Size := 16;
  WizardForm.FinishedHeadingLabel.Font.Style := [fsBold];
  
  // ==============================================
  // DIZIN SECIM ALANI
  // ==============================================
  
  // Dizin secim kutusu
  WizardForm.DirEdit.Color := DARK_SURFACE;
  WizardForm.DirEdit.Font.Color := TEXT_WHITE;
  WizardForm.DirEdit.Font.Name := 'Segoe UI';
  WizardForm.DirEdit.Font.Size := 9;
  
  // Grup secim kutusu
  WizardForm.GroupEdit.Color := DARK_SURFACE;
  WizardForm.GroupEdit.Font.Color := TEXT_WHITE;
  WizardForm.GroupEdit.Font.Name := 'Segoe UI';
  
  // ==============================================
  // LISTE KONTROLLERI
  // ==============================================
  
  // Gorev secim listesi (Masaustu kisayolu vb.)
  WizardForm.TasksList.Color := DARK_SURFACE;
  WizardForm.TasksList.Font.Color := TEXT_WHITE;
  WizardForm.TasksList.Font.Name := 'Segoe UI';
  WizardForm.TasksList.Font.Size := 9;
  
  // Bilesen listesi
  WizardForm.ComponentsList.Color := DARK_SURFACE;
  WizardForm.ComponentsList.Font.Color := TEXT_WHITE;
  
  // Tur listesi
  WizardForm.TypesCombo.Color := DARK_SURFACE;
  WizardForm.TypesCombo.Font.Color := TEXT_WHITE;
  
  // ==============================================
  // ILERLEME CUBUGU ALANI
  // ==============================================
  
  WizardForm.StatusLabel.Font.Color := TEXT_LIGHT;
  WizardForm.StatusLabel.Font.Name := 'Segoe UI';
  WizardForm.StatusLabel.Font.Size := 9;
  
  WizardForm.FilenameLabel.Font.Color := TEXT_MUTED;
  WizardForm.FilenameLabel.Font.Name := 'Segoe UI';
  WizardForm.FilenameLabel.Font.Size := 8;
  
  // Progress bar (ilerleme cubugu) - renklerini sistem uzerinden degistiremiyoruz
  // ama arka plana bir panel koyarak daha koyu gorunmesini saglayabiliriz
  WizardForm.ProgressGauge.Parent.Color := DARK_BG;
  
  // ==============================================
  // ALT BUTON PANELI
  // ==============================================
  
  // Buton panel arka plani (Geri / Ileri / Iptal butonlari)
  // Bevel cizgisinin ustundeki alan
  WizardForm.Bevel.Visible := False; // Eski stil cizgiyi gizle
  
  // Buton fontlari
  WizardForm.BackButton.Font.Name := 'Segoe UI';
  WizardForm.BackButton.Font.Size := 9;
  
  WizardForm.NextButton.Font.Name := 'Segoe UI';
  WizardForm.NextButton.Font.Size := 9;
  
  WizardForm.CancelButton.Font.Name := 'Segoe UI';
  WizardForm.CancelButton.Font.Size := 9;
  
  // ==============================================
  // LISANS VE BILGI ALANLARI
  // ==============================================
  
  WizardForm.LicenseMemo.Color := DARK_SURFACE;
  WizardForm.LicenseMemo.Font.Color := TEXT_LIGHT;
  WizardForm.LicenseMemo.Font.Name := 'Segoe UI';
  
  WizardForm.InfoBeforeMemo.Color := DARK_SURFACE;
  WizardForm.InfoBeforeMemo.Font.Color := TEXT_LIGHT;
  WizardForm.InfoBeforeMemo.Font.Name := 'Segoe UI';
  
  WizardForm.InfoAfterMemo.Color := DARK_SURFACE;
  WizardForm.InfoAfterMemo.Font.Color := TEXT_LIGHT;
  WizardForm.InfoAfterMemo.Font.Name := 'Segoe UI';

  // ==============================================
  // DIZIN VE BILESEN ETIKETLERI
  // ==============================================
  
  WizardForm.SelectDirLabel.Font.Color := TEXT_LIGHT;
  WizardForm.SelectDirLabel.Font.Name := 'Segoe UI';
  
  WizardForm.SelectDirBrowseLabel.Font.Color := TEXT_MUTED;
  WizardForm.SelectDirBrowseLabel.Font.Name := 'Segoe UI';
  
  WizardForm.SelectComponentsLabel.Font.Color := TEXT_LIGHT;
  WizardForm.SelectComponentsLabel.Font.Name := 'Segoe UI';
  
  WizardForm.SelectTasksLabel.Font.Color := TEXT_LIGHT;
  WizardForm.SelectTasksLabel.Font.Name := 'Segoe UI';
  
  WizardForm.DiskSpaceLabel.Font.Color := TEXT_MUTED;
  WizardForm.DiskSpaceLabel.Font.Name := 'Segoe UI';
  
  WizardForm.ReadyLabel.Font.Color := TEXT_LIGHT;
  WizardForm.ReadyLabel.Font.Name := 'Segoe UI';
  WizardForm.ReadyLabel.Font.Size := 9;
  
  WizardForm.ReadyMemo.Color := DARK_SURFACE;
  WizardForm.ReadyMemo.Font.Color := TEXT_LIGHT;
  WizardForm.ReadyMemo.Font.Name := 'Segoe UI';
  WizardForm.ReadyMemo.Font.Size := 9;
  
  // Finish page checkboxes
  WizardForm.RunList.Color := DARK_BG;
  WizardForm.RunList.Font.Color := TEXT_WHITE;
  WizardForm.RunList.Font.Name := 'Segoe UI';
  WizardForm.RunList.Font.Size := 9;
  
  // NoIcons checkbox
  WizardForm.NoIconsCheck.Font.Color := TEXT_LIGHT;
  WizardForm.NoIconsCheck.Font.Name := 'Segoe UI';
  
  // Yazi boyutu kuculterek daha modern gorunum
  WizardForm.DirBrowseButton.Font.Name := 'Segoe UI';
  WizardForm.DirBrowseButton.Font.Size := 9;
  WizardForm.GroupBrowseButton.Font.Name := 'Segoe UI';
  WizardForm.GroupBrowseButton.Font.Size := 9;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  // Her sayfa degistiginde arka plan rengini taze (bazi sayfalar sifirlayabiliyor)
  // (Notebook bilesenleri Color destegi sunmadigi icin kaldirildi)
  WizardForm.MainPanel.Color := DARK_SURFACE;
end;
