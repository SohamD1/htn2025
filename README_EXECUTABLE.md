# Converting start-all.sh to Windows Executable

I've created several options for you to run the startup script as an executable on Windows:

## Option 1: Use the Batch File (Immediate Solution)
- **File**: `start-all.bat`
- **Usage**: Double-click the file or run `start-all.bat` in command prompt
- This is immediately executable and works like an .exe file

## Option 2: Use PowerShell Script
- **File**: `start-all.ps1`
- **Usage**: Right-click → "Run with PowerShell" or run `powershell -ExecutionPolicy Bypass -File start-all.ps1`

## Option 3: Compile C++ Launcher to EXE
- **File**: `start-all-launcher.cpp`
- **Requirements**: C++ compiler (Visual Studio, MinGW, or similar)

### To compile with MinGW (if available):
```bash
g++ -o start-all.exe start-all-launcher.cpp
```

### To compile with Visual Studio:
```bash
cl start-all-launcher.cpp /Fe:start-all.exe
```

## Option 4: Convert Batch to EXE (Recommended)
You can use free tools to convert the batch file to an executable:

1. **Bat To Exe Converter** (Free)
   - Download from: https://bat-to-exe-converter.en.softonic.com/
   - Load `start-all.bat`
   - Click "Compile" to create `start-all.exe`

2. **IExpress** (Built into Windows)
   - Run `iexpress` from Windows Run dialog
   - Create self-extracting package with your batch file

3. **Online Converters**
   - Various online tools can convert .bat to .exe

## Files Created:
- `start-all.bat` - Windows batch version (immediately usable)
- `start-all.ps1` - PowerShell version with better error handling
- `start-all-launcher.cpp` - C++ source for compilation
- This README with instructions

The batch file (`start-all.bat`) is ready to use immediately and functions like an executable!