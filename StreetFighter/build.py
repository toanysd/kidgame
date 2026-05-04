import urllib.request
import tarfile
import os
import subprocess
import shutil

url = "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.19.12.tgz"
filename = "esbuild.tgz"

print("Downloading esbuild...")
urllib.request.urlretrieve(url, filename)

print("Extracting...")
with tarfile.open(filename, "r:gz") as tar:
    tar.extractall("esbuild_temp")

exe_path = os.path.join("esbuild_temp", "package", "esbuild.exe")
dest_exe = "esbuild.exe"
if os.path.exists(dest_exe):
    os.remove(dest_exe)
shutil.move(exe_path, dest_exe)

print("Running esbuild...")
subprocess.run([dest_exe, "src/index.js", "--bundle", "--outfile=bundle.js"])

print("Cleanup...")
os.remove(filename)
shutil.rmtree("esbuild_temp")
print("Build successful!")
